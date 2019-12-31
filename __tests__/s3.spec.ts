import { WebLocalFileSystemAsync } from "../src/WebLocalFileSystemAsync";
import { FileSystemAsync } from "../src/filesystem";
import { NOT_FOUND_ERR } from "../src/FileError";
import { S3 } from "aws-sdk";

let fs: FileSystemAsync;
beforeAll(async () => {
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

  const factory = new WebLocalFileSystemAsync(bucket, "s3", options);
  fs = await factory.requestFileSystemAsync(
    window.PERSISTENT,
    Number.MAX_VALUE
  );
});

test("add empty file", async done => {
  const fileEntry = await fs.root.getFile("empty.txt", {
    create: true,
    exclusive: true
  });
  expect(fileEntry.name).toBe("empty.txt");
  expect(fileEntry.fullPath).toBe("/empty.txt");
  expect(fileEntry.isDirectory).toBe(false);
  expect(fileEntry.isFile).toBe(true);

  done();
});

test("add text file", async done => {
  const fileEntry = await fs.root.getFile("test.txt", {
    create: true,
    exclusive: true
  });
  expect(fileEntry.name).toBe("test.txt");
  expect(fileEntry.fullPath).toBe("/test.txt");
  expect(fileEntry.isDirectory).toBe(false);
  expect(fileEntry.isFile).toBe(true);

  const writer = await fileEntry.createWriter();
  await writer.write(new Blob(["hoge"], { type: "text/plain" }));

  let file = await fileEntry.file();
  expect(file.size).toBe(4);

  await writer.write(new Blob(["fuga"], { type: "text/plain" }));
  file = await fileEntry.file();
  expect(file.size).toBe(8);

  const reader = new FileReader();
  const str = await new Promise<string>(resolve => {
    reader.addEventListener("loadend", e => {
      const text = (e.srcElement as any).result;
      resolve(text);
    });
    reader.readAsText(file);
  });
  expect(str).toBe("hogefuga");

  done();
});

test("create dir", async done => {
  const dirEntry = await fs.root.getDirectory("folder", {
    create: true,
    exclusive: true
  });
  expect(dirEntry.isFile).toBe(false);
  expect(dirEntry.isDirectory).toBe(true);
  expect(dirEntry.name).toBe("folder");

  done();
});

test("create file in the dir", async done => {
  const dirEntry = await fs.root.getDirectory("folder");
  const fileEntry = await dirEntry.getFile("in.txt", {
    create: true,
    exclusive: true
  });
  expect(fileEntry.fullPath).toBe("/folder/in.txt");
  try {
    await dirEntry.getFile("out.txt");
    fail();
  } catch (e) {
    expect(e).toBe(NOT_FOUND_ERR);
  }

  done();
});

test("readdir", async done => {
  const reader = fs.root.createReader();
  const entries = await reader.readEntries();
  let names = ["empty.txt", "test.txt", "folder"];
  for (const entry of entries) {
    names = names.filter(name => name !== entry.name);
  }
  expect(names.length).toBe(0);

  done();
});