import { base64ToFile, blobToFile } from "./IdbUtil";
import { DIR_OPEN_BOUND, DIR_SEPARATOR } from "./IdbConstants";
import { IdbDirectoryEntry } from "./IdbDirectoryEntry";
import { IdbEntry } from "./IdbEntry";
import { IdbFileEntry } from "./IdbFileEntry";
import { IdbFileSystem } from "./IdbFileSystem";
import { IdbObject } from "./IdbObject";

const FILE_STORE = "entries";

const indexedDB: IDBFactory =
  window.indexedDB ||
  (window as any).mozIndexedDB ||
  (window as any).msIndexedDB;

export class Idb {
  static SUPPORTS_BLOB = true;

  private initialized = false;
  private db: IDBDatabase;
  filesystem: IdbFileSystem;

  constructor() {
    this.filesystem = new IdbFileSystem(this);
  }

  private onError(this: any, ev: Event) {
    console.error(ev);
  }

  initialize() {
    return new Promise((resolve, reject) => {
      const dbName = "blob-support";
      indexedDB.deleteDatabase(dbName).onsuccess = function() {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = function() {
          request.result.createObjectStore("store");
        };
        request.onerror = function() {
          Idb.SUPPORTS_BLOB = false;
          resolve();
        };
        request.onsuccess = function() {
          const db = request.result;
          try {
            const blob = new Blob(["test"], { type: "text/plain" });
            const transaction = db.transaction("store", "readwrite");
            transaction.objectStore("store").put(blob, "key");
            Idb.SUPPORTS_BLOB = true;
          } catch (err) {
            Idb.SUPPORTS_BLOB = false;
          } finally {
            db.close();
            indexedDB.deleteDatabase(dbName);
          }
          resolve();
        };
      };
    });
  }

  async open(dbName: string) {
    if (!this.initialized) {
      await this.initialize();
      this.initialized = true;
    }

    const self = this;
    return new Promise<void>((resolve, reject) => {
      // TODO: FF 12.0a1 isn't liking a db name with : in it.
      const request = indexedDB.open(
        dbName.replace(":", "_") /*, 1 /*version*/
      );
      request.onupgradeneeded = function(ev) {
        // First open was called or higher db version was used.

        // console.log('onupgradeneeded: oldVersion:' + e.oldVersion,
        //           'newVersion:' + e.newVersion);
        const request = ev.target as IDBRequest;
        self.db = request.result;
        self.db.onerror = self.onError;

        if (!self.db.objectStoreNames.contains(FILE_STORE)) {
          self.db.createObjectStore(
            FILE_STORE /*,{keyPath: 'id', autoIncrement: true}*/
          );
        }
      };
      request.onsuccess = function(e) {
        self.db = (e.target as IDBRequest).result;
        self.db.onerror = self.onError;
        resolve();
      };
      request.onerror = function(ev) {
        reject(ev);
      };
      request.onblocked = function(ev) {
        reject(ev);
      };
    });
  }

  close() {
    this.db.close();
    delete this.db;
  }

  drop() {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        resolve();
      }

      const dbName = this.db.name;
      const request = indexedDB.deleteDatabase(dbName);
      request.onerror = function(ev) {
        reject(ev);
      };
      request.onsuccess = function(ev) {};

      this.close();
    });
  }

  get(fullPath: string) {
    return new Promise<IdbObject>((resolve, reject) => {
      const tx = this.db.transaction([FILE_STORE], "readonly");
      //const request = tx.objectStore(FILE_STORE_).get(fullPath);
      const range = IDBKeyRange.bound(
        fullPath,
        fullPath + DIR_OPEN_BOUND,
        false,
        true
      );
      const request = tx.objectStore(FILE_STORE).get(range);
      tx.onabort = function(ev) {
        reject(ev);
      };
      tx.oncomplete = function(ev) {
        resolve(request.result);
      };
    });
  }

  getAllEntries(fullPath: string) {
    return new Promise<IdbEntry[]>((resolve, reject) => {
      let entries: IdbEntry[] = [];

      //const range = IDBKeyRange.lowerBound(fullPath, true);
      //const range = IDBKeyRange.upperBound(fullPath, true);

      // Treat the root entry special. Querying it returns all entries because
      // they match '/'.
      let range = null;
      if (fullPath != DIR_SEPARATOR) {
        //console.log(fullPath + '/', fullPath + DIR_OPEN_BOUND)
        range = IDBKeyRange.bound(
          fullPath + DIR_SEPARATOR,
          fullPath + DIR_OPEN_BOUND,
          false,
          true
        );
      }

      const tx = this.db.transaction([FILE_STORE], "readonly");
      tx.onabort = function(ev) {
        reject(ev);
      };
      tx.oncomplete = function(ev) {
        // TODO: figure out how to do be range queries instead of filtering result
        // in memory :(
        entries = entries.filter(function(entry) {
          const entryPartsLen = entry.fullPath.split(DIR_SEPARATOR).length;
          const fullPathPartsLen = fullPath.split(DIR_SEPARATOR).length;

          if (
            fullPath == DIR_SEPARATOR &&
            entryPartsLen < fullPathPartsLen + 1
          ) {
            // Hack to filter out entries in the root folder. This is inefficient
            // because reading the entires of fs.root (e.g. '/') returns ALL
            // results in the database, then filters out the entries not in '/'.
            return entry;
          } else if (
            fullPath != DIR_SEPARATOR &&
            entryPartsLen == fullPathPartsLen + 1
          ) {
            // If this a subfolder and entry is a direct child, include it in
            // the results. Otherwise, it's not an entry of this folder.
            return entry;
          }
        });

        resolve(entries);
      };

      const request = tx.objectStore(FILE_STORE).openCursor(range);
      const filesystem = this.filesystem;
      request.onsuccess = function(ev) {
        const cursor = <IDBCursorWithValue>(<IDBRequest>ev.target).result;
        if (cursor) {
          const obj = cursor.value as IdbObject;

          entries.push(
            obj.isFile
              ? new IdbFileEntry({
                  filesystem: filesystem,
                  name: obj.name,
                  fullPath: obj.fullPath,
                  lastModifiedDate: new Date(obj.lastModified),
                  file: Idb.SUPPORTS_BLOB
                    ? blobToFile(
                        [obj.content as Blob],
                        obj.name,
                        obj.lastModified
                      )
                    : base64ToFile(
                        obj.content as string,
                        obj.name,
                        obj.lastModified
                      )
                })
              : new IdbDirectoryEntry({
                  filesystem: filesystem,
                  name: obj.name,
                  fullPath: obj.fullPath,
                  lastModifiedDate: new Date(obj.lastModified)
                })
          );
          cursor["continue"]();
        }
      };
    });
  }

  delete(fullPath: string) {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        resolve();
      }

      const tx = this.db.transaction([FILE_STORE], "readwrite");
      tx.onabort = function(ev) {
        reject(ev);
      };
      tx.oncomplete = function(ev) {
        resolve();
      };

      //const request = tx.objectStore(FILE_STORE_).delete(fullPath);
      const range = IDBKeyRange.bound(
        fullPath,
        fullPath + DIR_OPEN_BOUND,
        false,
        true
      );
      tx.objectStore(FILE_STORE)["delete"](range);
    });
  }

  put(obj: IdbObject) {
    return new Promise<IdbObject>((resolve, reject) => {
      if (!this.db) {
        resolve(null);
      }

      const tx = this.db.transaction([FILE_STORE], "readwrite");
      tx.onabort = function(ev) {
        reject(ev);
      };
      tx.oncomplete = function(ev) {
        resolve(obj);
      };

      tx.objectStore(FILE_STORE).put(obj, obj.fullPath);
    });
  }
}
