import { DIR_OPEN_BOUND, DIR_SEPARATOR } from "./IdbConstants";
import { IdbDirectoryEntry } from "./IdbDirectoryEntry";
import { IdbFileEntry } from "./IdbFileEntry";
import { IdbObject } from "./IdbObject";

const FILE_STORE = "entries";

export class Idb {
  db: IDBDatabase;
  storageType: string;

  constructor(storageType: string) {
    this.storageType = storageType;
  }

  private onError(this: any, ev: Event) {
    console.error(ev);
  }

  async open(dbName: string) {
    const self = this;

    return new Promise<void>((resolve, reject) => {
      // TODO: FF 12.0a1 isn't liking a db name with : in it.
      const request = indexedDB.open(
        dbName.replace(":", "_") /*, 1 /*version*/
      );
      request.onerror = function(ev) {
        reject(ev);
      };

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

        resolve();
      };

      request.onsuccess = function(e) {
        self.db = (e.target as IDBRequest).result;
        self.db.onerror = self.onError;
        resolve();
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
    return new Promise<Entry[]>((resolve, reject) => {
      let results: Entry[] = [];

      //var range = IDBKeyRange.lowerBound(fullPath, true);
      //var range = IDBKeyRange.upperBound(fullPath, true);

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
        results = results.filter(function(val) {
          var valPartsLen = val.fullPath.split(DIR_SEPARATOR).length;
          var fullPathPartsLen = fullPath.split(DIR_SEPARATOR).length;

          if (fullPath == DIR_SEPARATOR && valPartsLen < fullPathPartsLen + 1) {
            // Hack to filter out entries in the root folder. This is inefficient
            // because reading the entires of fs.root (e.g. '/') returns ALL
            // results in the database, then filters out the entries not in '/'.
            return val;
          } else if (
            fullPath != DIR_SEPARATOR &&
            valPartsLen == fullPathPartsLen + 1
          ) {
            // If this a subfolder and entry is a direct child, include it in
            // the results. Otherwise, it's not an entry of this folder.
            return val;
          }
        });

        resolve(results);
      };

      var request = tx.objectStore(FILE_STORE).openCursor(range);

      request.onsuccess = function(ev) {
        var cursor = <IDBCursorWithValue>(<IDBRequest>ev.target).result;
        if (cursor) {
          var val = cursor.value;

          results.push(
            val.isFile ? new IdbFileEntry(val) : new IdbDirectoryEntry(val)
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

      //var request = tx.objectStore(FILE_STORE_).delete(fullPath);
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

      var tx = this.db.transaction([FILE_STORE], "readwrite");
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
