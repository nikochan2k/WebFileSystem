import {
  EntryCallback,
  ErrorCallback,
  FileSystemCallback,
  LocalFileSystem
} from "../filesystem";
import { Idb } from "./Idb";
import { IdbFileSystem } from "./IdbFileSystem";

export let IDB_SUPPORTS_BLOB = true;

const indexedDB: IDBFactory =
  window.indexedDB ||
  (window as any).mozIndexedDB ||
  (window as any).msIndexedDB;

// Check to see if IndexedDB support blobs.
(() => {
  const dbName = "blob-support";
  indexedDB.deleteDatabase(dbName).onsuccess = function() {
    const request = indexedDB.open(dbName, 1);
    request.onerror = function() {
      IDB_SUPPORTS_BLOB = false;
    };
    request.onsuccess = function() {
      var db = request.result;
      try {
        const blob = new Blob(["test"], { type: "text/plain" });
        const transaction = db.transaction("store", "readwrite");
        transaction.objectStore("store").put(blob, "key");
        IDB_SUPPORTS_BLOB = true;
      } catch (err) {
        IDB_SUPPORTS_BLOB = false;
      } finally {
        db.close();
        indexedDB.deleteDatabase(dbName);
      }
    };
    request.onupgradeneeded = function() {
      request.result.createObjectStore("store");
    };
  };
})();

export class IdbLocalFileSystem implements LocalFileSystem {
  readonly TEMPORARY = 0;
  readonly PERSISTENT = 1;

  requestFileSystem(
    type: number,
    size: number,
    successCallback: FileSystemCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    const storageType = type === this.TEMPORARY ? "Temporary" : "Persistent";
    const dbName =
      (location.protocol + location.host).replace(/:/g, "_") +
      ":" +
      storageType;
    const idb = new Idb(storageType);
    idb
      .open(dbName)
      .then(() => {
        const fs = new IdbFileSystem(idb);
        successCallback(fs);
      })
      .catch(err => {
        errorCallback(err);
      });
  }

  resolveLocalFileSystemURL(
    url: string,
    successCallback: EntryCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }
}
