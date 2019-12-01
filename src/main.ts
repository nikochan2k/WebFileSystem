import {
  LocalFileSystem,
  FileSystemCallback,
  ErrorCallback,
  EntryCallback,
  Entry
} from "./filesystem";
import { INVALID_MODIFICATION_ERR, NOT_FOUND_ERR } from "./FileError";

const DIR_SEPARATOR = "/";
const DIR_OPEN_BOUND = String.fromCharCode(DIR_SEPARATOR.charCodeAt(0) + 1);

const nativeFileSystem =
  window.requestFileSystem || window.webkitRequestFileSystem;

const nativeFileSystemSync =
  window.requestFileSystemSync || window.webkitRequestFileSystemSync;

const indexedDB: IDBFactory =
  window.indexedDB ||
  (window as any).mozIndexedDB ||
  (window as any).msIndexedDB;

let IDB_SUPPORTS_BLOB = true;

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

function resolveToFullPath_(cwdFullPath: string, path: string) {
  let fullPath = path;

  const relativePath = path[0] != DIR_SEPARATOR;
  if (relativePath) {
    fullPath = cwdFullPath + DIR_SEPARATOR + path;
  }

  // Normalize '.'s,  '..'s and '//'s.
  const parts = fullPath.split(DIR_SEPARATOR);
  const finalParts = [];
  for (const part of parts) {
    if (part === "..") {
      // Go up one level.
      if (!finalParts.length) {
        throw Error("Invalid path");
      }
      finalParts.pop();
    } else if (part === ".") {
      // Skip over the current directory.
    } else if (part !== "") {
      // Eliminate sequences of '/'s as well as possible leading/trailing '/'s.
      finalParts.push(part);
    }
  }

  fullPath = DIR_SEPARATOR + finalParts.join(DIR_SEPARATOR);

  // fullPath is guaranteed to be normalized by construction at this point:
  // '.'s, '..'s, '//'s will never appear in it.
  return fullPath;
}

const FILE_STORE_ = "entries";

class Idb {
  db: IDBDatabase;

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

        if (!self.db.objectStoreNames.contains(FILE_STORE_)) {
          self.db.createObjectStore(
            FILE_STORE_ /*,{keyPath: 'id', autoIncrement: true}*/
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
    return new Promise<any>((resolve, reject) => {
      const tx = this.db.transaction([FILE_STORE_], "readonly");
      //const request = tx.objectStore(FILE_STORE_).get(fullPath);
      const range = IDBKeyRange.bound(
        fullPath,
        fullPath + DIR_OPEN_BOUND,
        false,
        true
      );
      const request = tx.objectStore(FILE_STORE_).get(range);
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

      const tx = this.db.transaction([FILE_STORE_], "readonly");
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

      var request = tx.objectStore(FILE_STORE_).openCursor(range);

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

      const tx = this.db.transaction([FILE_STORE_], "readwrite");
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
      tx.objectStore(FILE_STORE_)["delete"](range);
    });
  }

  put(entry: Entry) {
    return new Promise<Entry>((resolve, reject) => {
      if (!this.db) {
        resolve(null);
      }

      var tx = this.db.transaction([FILE_STORE_], "readwrite");
      tx.onabort = function(ev) {
        reject(ev);
      };
      tx.oncomplete = function(ev) {
        resolve(entry);
      };

      tx.objectStore(FILE_STORE_).put(entry, entry.fullPath);
    });
  }
}

class IdbFileSystem implements FileSystem {
  name: string;
  root: DirectoryEntry;

  constructor(public idb: Idb) {
    this.root = new IdbDirectoryEntry({
      filesystem: this,
      name: "",
      fullPath: DIR_SEPARATOR
    });
  }
}

class IdbLocalFileSystem implements LocalFileSystem {
  TEMPORARY = 0;
  PERSISTENT = 1;

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
    const idb = new Idb();
    idb.open(dbName);
    const fs = new IdbFileSystem(idb);
    successCallback(fs);
  }

  resolveLocalFileSystemURL(
    url: string,
    successCallback: EntryCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }
}

class IdbFile implements File {
  constructor(
    private blob: Blob,
    public name: string,
    public lastModifiedDate: Date
  ) {}

  get size() {
    return this.blob.size;
  }

  get lastModified() {
    return this.lastModifiedDate.getTime();
  }

  get type() {
    return this.blob.type;
  }

  slice(
    start?: number | undefined,
    end?: number | undefined,
    contentType?: string | undefined
  ): Blob {
    if (this.blob == null) {
      return null;
    }
    return this.blob.slice(start, end, contentType);
  }
}

interface EntryParams {
  filesystem: IdbFileSystem;
  name: string;
  fullPath: string;
}

class IdbFileEntry implements FileEntry {
  public isFile = true;
  public isDirectory = false;
  public filesystem: IdbFileSystem;
  public name: string;
  public fullPath: string;

  constructor(entry: EntryParams) {
    this.filesystem = entry.filesystem;
    this.name = entry.name;
    this.fullPath = entry.fullPath;
  }

  createWriter(
    successCallback: FileWriterCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  file(
    successCallback: FileCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  moveTo(
    parent: DirectoryEntry,
    newName?: string | undefined,
    successCallback?: EntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  copyTo(
    parent: DirectoryEntry,
    newName?: string | undefined,
    successCallback?: EntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  toURL(): string {
    throw new Error("Method not implemented.");
  }

  remove(
    successCallback: VoidCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  getParent(
    successCallback: DirectoryEntryCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }
}

class IdbDirectoryEntry implements DirectoryEntry {
  public isFile = false;
  public isDirectory = true;
  public filesystem: IdbFileSystem;
  public name: string;
  public fullPath: string;

  constructor(entry: EntryParams) {
    this.filesystem = entry.filesystem;
    this.name = entry.name;
    this.fullPath = entry.fullPath;
  }

  createReader(): DirectoryReader {
    throw new Error("Method not implemented.");
  }

  getFile(
    path: string,
    options?: Flags | undefined,
    successCallback?: FileEntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  getDirectory(
    path: string,
    options?: Flags | undefined,
    successCallback?: DirectoryEntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    // Create an absolute path if we were handed a relative one.
    path = resolveToFullPath_(this.fullPath, path);

    const idb_ = this.filesystem.idb;
    idb_
      .get(path)
      .then(folderEntry => {
        if (!options) {
          options = {};
        }

        if (
          options.create === true &&
          options.exclusive === true &&
          folderEntry
        ) {
          // If create and exclusive are both true, and the path already exists,
          // getDirectory must fail.
          if (errorCallback) {
            errorCallback(INVALID_MODIFICATION_ERR);
            return;
          }
        } else if (options.create === true && !folderEntry) {
          // If create is true, the path doesn't exist, and no other error occurs,
          // getDirectory must create it as a zero-length file and return a corresponding
          // DirectoryEntry.
          const dirEntry = new IdbDirectoryEntry({
            name: path.split(DIR_SEPARATOR).pop(), // Just need filename.
            fullPath: path,
            filesystem: this.filesystem
          });

          idb_
            .put(dirEntry)
            .then(entry => {
              successCallback(dirEntry);
            })
            .catch(err => {
              errorCallback(err);
            });
        } else if (options.create === true && folderEntry) {
          if (folderEntry.isDirectory) {
            // IDB won't save methods, so we need re-create the DirectoryEntry.
            successCallback(new IdbDirectoryEntry(folderEntry));
          } else {
            if (errorCallback) {
              errorCallback(INVALID_MODIFICATION_ERR);
              return;
            }
          }
        } else if (!options.create && !folderEntry) {
          // Handle root special. It should always exist.
          if (path == DIR_SEPARATOR) {
            folderEntry = new IdbDirectoryEntry({
              name: "",
              fullPath: DIR_SEPARATOR,
              filesystem: this.filesystem
            });
            successCallback(folderEntry);
            return;
          }

          // If create is not true and the path doesn't exist, getDirectory must fail.
          if (errorCallback) {
            errorCallback(NOT_FOUND_ERR);
            return;
          }
        } else if (!options.create && folderEntry && folderEntry.isFile) {
          // If create is not true and the path exists, but is a file, getDirectory
          // must fail.
          if (errorCallback) {
            errorCallback(INVALID_MODIFICATION_ERR);
            return;
          }
        } else {
          // Otherwise, if no other error occurs, getDirectory must return a
          // DirectoryEntry corresponding to path.

          // IDB won't' save methods, so we need re-create DirectoryEntry.
          successCallback(new IdbDirectoryEntry(folderEntry));
        }
      })
      .catch(err => {
        errorCallback(err);
      });
  }

  removeRecursively(
    successCallback: VoidCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  moveTo(
    parent: DirectoryEntry,
    newName?: string | undefined,
    successCallback?: EntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  copyTo(
    parent: DirectoryEntry,
    newName?: string | undefined,
    successCallback?: EntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  toURL(): string {
    throw new Error("Method not implemented.");
  }

  remove(
    successCallback: VoidCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  getParent(
    successCallback: DirectoryEntryCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }
}
