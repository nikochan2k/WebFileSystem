require("fake-indexeddb/auto");
import { FileSystemAsync } from "../FileSystemAsync";
import { IdbLocalFileSystem } from "../idb/IdbLocalFileSystem";
import { LocalFileSystemAsync } from "../LocalFileSystemAsync";
import { S3 } from "aws-sdk";
import { S3LocalFileSystem } from "../s3/S3LocalFileSystem";
import { Synchronizer } from "../Synchronizer";

let local: FileSystemAsync;
let remote: FileSystemAsync;
let synchronizer: Synchronizer;
beforeAll(async () => {
  const idbLocalFileSystem = new IdbLocalFileSystem("web-file-system-test");
  const idbFactory = new LocalFileSystemAsync(idbLocalFileSystem);
  local = await idbFactory.requestFileSystemAsync(
    window.PERSISTENT,
    Number.MAX_VALUE
  );

  const options: S3.ClientConfiguration = {
    accessKeyId: "KFS0LZVKZ8G456A502L3",
    secretAccessKey: "uVwBONMdTwJI1+C8jUhrypvshHz3OY8Ooar3amdC",
    endpoint: "http://127.0.0.1:9000",
    s3ForcePathStyle: true, // needed with minio?
    signatureVersion: "v4"
  };

  const s3 = new S3(options);
  const bucket = "web-file-system-test";
  try {
    await s3.createBucket({ Bucket: bucket }).promise();
  } catch (e) {}
  const list = await s3.listObjectsV2({ Bucket: bucket }).promise();
  for (const content of list.Contents) {
    await s3.deleteObject({ Bucket: bucket, Key: content.Key }).promise();
  }

  const s3LocalFileSystem = new S3LocalFileSystem(
    "web-file-system-test",
    options
  );
  const s3Factory = new LocalFileSystemAsync(s3LocalFileSystem);
  remote = await s3Factory.requestFileSystemAsync(
    window.PERSISTENT,
    Number.MAX_VALUE
  );

  synchronizer = new Synchronizer(local, remote);
});

test("add a empty file", async done => {
  let localFE = await local.root.getFile("empty.txt", {
    create: true,
    exclusive: true
  });
  await synchronizer.synchronizeAll();

  localFE = await local.root.getFile("empty.txt");
  const remoteReader = remote.root.createReader();
  const remoteEntries = await remoteReader.readEntries();
  expect(remoteEntries.length).toBe(1);
  const remoteE = remoteEntries[0];
  expect(remoteE.isFile).toBe(true);
  expect(remoteE.name).toBe(localFE.name);
  expect(remoteE.fullPath).toBe(localFE.fullPath);

  const localMeta = await localFE.getMetadata();
  const localLastModified = localMeta.modificationTime.getTime();
  const remoteMeta = await remoteE.getMetadata();
  const remoteLastModified = remoteMeta.modificationTime.getTime();
  expect(remoteLastModified).toBe(localLastModified);

  done();
});

test("add a text file", async done => {
  let localFE = await local.root.getFile("test.txt", {
    create: true,
    exclusive: true
  });
  const writer = await localFE.createWriter();
  await writer.write(new Blob(["hoge"], { type: "text/plain" }));

  await synchronizer.synchronizeAll();

  const remoteReader = remote.root.createReader();
  const remoteEntries = await remoteReader.readEntries();
  expect(remoteEntries.length).toBe(2);

  let entries = remoteEntries.filter(re => {
    return re.name === "empty.txt";
  });
  expect(entries.length).toBe(1);
  const emptyTxt = entries[0];
  expect(emptyTxt.isFile).toBe(true);
  const emptyTxtMeta = await emptyTxt.getMetadata();
  expect(emptyTxtMeta.size).toBe(0);

  entries = remoteEntries.filter(re => {
    return re.name === "test.txt";
  });
  expect(entries.length).toBe(1);
  const testTxt = entries[0];
  expect(testTxt.isFile).toBe(true);
  localFE = await local.root.getFile("test.txt");
  const localFEMeta = await localFE.getMetadata();
  const testTxtMeta = await testTxt.getMetadata();
  expect(testTxtMeta.size).toBe(localFEMeta.size);
  expect(testTxtMeta.modificationTime.getTime()).toBe(
    localFEMeta.modificationTime.getTime()
  );

  done();
});

test("create folder, and add a text file", async done => {
  let localDE = await local.root.getDirectory("folder", {
    create: true,
    exclusive: true
  });
  await localDE.getFile("in.txt", {
    create: true,
    exclusive: true
  });

  await synchronizer.synchronizeAll();

  const localFE = await local.root.getFile("/folder/in.txt");
  const localMeta = await localFE.getMetadata();
  const remoteDE = await remote.root.getDirectory("folder");
  const remoteFE = await remoteDE.getFile("in.txt");
  const remoteMeta = await remoteFE.getMetadata();
  expect(remoteMeta.size).toBe(localMeta.size);
  expect(remoteMeta.modificationTime.getTime()).toBe(
    localMeta.modificationTime.getTime()
  );

  done();
});
