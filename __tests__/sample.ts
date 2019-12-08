require("fake-indexeddb/auto");
import { IdbFileSystemFactory } from "../src/idb/IdbFileSystemFactory";

test("add empty content", async done => {
  const global = new IdbFileSystemFactory();
  global.requestFileSystem(global.PERSISTENT, Number.MAX_VALUE, fs => {
    fs.root.getFile("empty.txt", { create: true, exclusive: true });
    done();
  });
});

test("add text", async done => {
  const global = new IdbFileSystemFactory();
  global.requestFileSystem(global.PERSISTENT, Number.MAX_VALUE, fs => {
    fs.root.getFile("test.txt", { create: true, exclusive: true }, entry => {
      entry.createWriter(writer => {
        writer.write(new Blob(["test"], { type: "text/plain" }));
        done();
      });
    });
  });
});

test("list", async done => {
  const global = new IdbFileSystemFactory();
  global.requestFileSystem(global.PERSISTENT, Number.MAX_VALUE, fs => {
    const reader = fs.root.createReader();
    reader.readEntries(entries => {
      for (const entry of entries) {
        console.log(entry.fullPath);
      }
      done();
    });
  });
});
