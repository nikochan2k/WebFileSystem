require("fake-indexeddb/auto");
import { WebFileSystemAsyncFactory } from "../src/WebFileSystemAsyncFactory";
import { FileSystemAsync } from "../src/filesystem";

let fs: FileSystemAsync;
beforeAll(async () => {
  const factory = new WebFileSystemAsyncFactory();
  fs = await factory.requestFileSystemAsync(window.TEMPORARY, Number.MAX_VALUE);
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
  writer.write(new Blob(["test"], { type: "text/plain" }));

  const file = await fileEntry.file();
  expect(file.size).toBe(4);

  done();
});
