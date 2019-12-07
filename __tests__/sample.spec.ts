require("fake-indexeddb/auto");
import { IdbLocalFileSystem, initialize } from "../src/idb/IdbLocalFileSystem";

test("put value == get value", async done => {
  await initialize();
  const engine = new IdbLocalFileSystem();
  engine.requestFileSystem(engine.PERSISTENT, Number.MAX_VALUE, fs => {
    fs.root.getFile("log.txt", { create: true, exclusive: true }, entry => {
      entry.createWriter(writer => {
        writer.write(new Blob(["test"], { type: "text/plain" }));
        done();
      });
    });
  });
});
