import { DirectoryEntry, Flags } from "./filesystem";
import { EntryParams } from "./EntryParams";
import { IdbDirectoryReader } from "./IdbDirectoryReader";
import { IdbFileEntry } from "./IdbFileEntry";
import { IdbFileSystem } from "./IdbFileSystem";
import {
  INVALID_MODIFICATION_ERR,
  NOT_FOUND_ERR,
  NOT_IMPLEMENTED_ERR
} from "../FileError";

export const DIR_SEPARATOR = "/";
export const DIR_OPEN_BOUND = String.fromCharCode(
  DIR_SEPARATOR.charCodeAt(0) + 1
);

function resolveToFullPath(cwdFullPath: string, path: string) {
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

const EMPTY_BLOB = new Blob();

export class IdbDirectoryEntry implements DirectoryEntry {
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
    return new IdbDirectoryReader(this);
  }

  getFile(
    path: string,
    options?: Flags | undefined,
    successCallback?: FileEntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    // Create an absolute path if we were handed a relative one.
    path = resolveToFullPath(this.fullPath, path);
    const idb = this.filesystem.idb;
    idb
      .get(path)
      .then(entry => {
        const fileEntry = entry as IdbFileEntry;
        if (!options) {
          options = {};
        }

        if (options.create && options.exclusive && fileEntry) {
          // If create and exclusive are both true, and the path already exists,
          // getFile must fail.

          if (errorCallback) {
            errorCallback(INVALID_MODIFICATION_ERR);
            return;
          }
        } else if (options.create && !fileEntry) {
          // If create is true, the path doesn't exist, and no other error occurs,
          // getFile must create it as a zero-length file and return a corresponding
          // FileEntry.
          var zeroFileEntry = new IdbFileEntry({
            filesystem: this.filesystem,
            blob: EMPTY_BLOB,
            name: fileEntry.name,
            fullPath: path
          });

          idb
            .put(zeroFileEntry)
            .then(() => {
              successCallback(zeroFileEntry);
            })
            .catch(err => {
              errorCallback(err);
            });
        } else if (options.create && fileEntry) {
          if (fileEntry.isFile) {
            // IDB won't save methods, so we need re-create the FileEntry.
            successCallback(
              new IdbFileEntry({
                filesystem: this.filesystem,
                blob: fileEntry.blob,
                name: fileEntry.name,
                fullPath: path
              })
            );
          } else {
            if (errorCallback) {
              errorCallback(INVALID_MODIFICATION_ERR);
              return;
            }
          }
        } else if (!options.create && !fileEntry) {
          // If create is not true and the path doesn't exist, getFile must fail.
          if (errorCallback) {
            errorCallback(NOT_FOUND_ERR);
            return;
          }
        } else if (!options.create && fileEntry && fileEntry.isDirectory) {
          // If create is not true and the path exists, but is a directory, getFile
          // must fail.
          if (errorCallback) {
            errorCallback(INVALID_MODIFICATION_ERR);
            return;
          }
        } else {
          // Otherwise, if no other error occurs, getFile must return a FileEntry
          // corresponding to path.

          // IDB won't' save methods, so we need re-create the FileEntry.
          successCallback(new IdbFileEntry(fileEntry));
        }
      })
      .catch(err => {
        errorCallback(err);
      });
  }

  getDirectory(
    path: string,
    options?: Flags | undefined,
    successCallback?: DirectoryEntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    // Create an absolute path if we were handed a relative one.
    path = resolveToFullPath(this.fullPath, path);

    const idb = this.filesystem.idb;
    idb
      .get(path)
      .then(entry => {
        let folderEntry = entry as IdbDirectoryEntry;
        if (!options) {
          options = {};
        }

        if (options.create && options.exclusive && folderEntry) {
          // If create and exclusive are both true, and the path already exists,
          // getDirectory must fail.
          if (errorCallback) {
            errorCallback(INVALID_MODIFICATION_ERR);
            return;
          }
        } else if (options.create && !folderEntry) {
          // If create is true, the path doesn't exist, and no other error occurs,
          // getDirectory must create it as a zero-length file and return a corresponding
          // DirectoryEntry.
          const dirEntry = new IdbDirectoryEntry({
            filesystem: this.filesystem,
            name: path.split(DIR_SEPARATOR).pop(), // Just need filename.
            fullPath: path
          });

          idb
            .put(dirEntry)
            .then(entry => {
              successCallback(dirEntry);
            })
            .catch(err => {
              errorCallback(err);
            });
        } else if (options.create && folderEntry) {
          if (folderEntry.isDirectory) {
            // IDB won't save methods, so we need re-create the DirectoryEntry.
            successCallback(
              new IdbDirectoryEntry({
                filesystem: this.filesystem,
                name: folderEntry.name,
                fullPath: folderEntry.fullPath
              })
            );
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
              filesystem: this.filesystem,
              name: "",
              fullPath: DIR_SEPARATOR
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
    this.remove(successCallback, errorCallback);
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
    throw NOT_IMPLEMENTED_ERR;
  }

  copyTo(
    parent: DirectoryEntry,
    newName?: string | undefined,
    successCallback?: EntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw NOT_IMPLEMENTED_ERR;
  }

  toURL(): string {
    const origin = location.protocol + "//" + location.host;

    return (
      "filesystem:" +
      origin +
      DIR_SEPARATOR +
      this.filesystem.idb.storageType.toLowerCase() +
      this.fullPath
    );
  }

  remove(
    successCallback: VoidCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    const idb = this.filesystem.idb;
    idb
      .delete(this.fullPath)
      .then(() => {
        successCallback();
      })
      .catch(err => {
        errorCallback(err);
      });
  }

  getParent(
    successCallback: DirectoryEntryCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw NOT_IMPLEMENTED_ERR;
  }
}
