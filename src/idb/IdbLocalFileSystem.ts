import {
  EntryCallback,
  ErrorCallback,
  FileSystemCallback,
  LocalFileSystem
} from "../filesystem";
import { Idb } from "./Idb";
import { NOT_IMPLEMENTED_ERR } from "../FileError";
import { onError } from "./IdbUtil";

export let IDB_SUPPORTS_BLOB = true;

const indexedDB: IDBFactory =
  window.indexedDB ||
  (window as any).mozIndexedDB ||
  (window as any).msIndexedDB;

// Check to see if IndexedDB support blobs.
export function initialize() {
  return new Promise((resolve, reject) => {
    const dbName = "blob-support";
    indexedDB.deleteDatabase(dbName).onsuccess = function() {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = function() {
        request.result.createObjectStore("store");
      };
      request.onerror = function() {
        IDB_SUPPORTS_BLOB = false;
        resolve();
      };
      request.onsuccess = function() {
        const db = request.result;
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
        resolve();
      };
    };
  });
}

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
        successCallback(idb.filesystem);
      })
      .catch(err => {
        onError(err, errorCallback);
      });
  }

  resolveLocalFileSystemURL(
    url: string,
    successCallback: EntryCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw NOT_IMPLEMENTED_ERR;
  }
}
