import { base64ToFile, blobToFile, createEmptyFile, onError } from "./IdbUtil";
import { DIR_SEPARATOR, EMPTY_BLOB } from "./IdbConstants";
import {
  DirectoryEntry,
  ErrorCallback,
  FileEntryCallback,
  Flags,
  MetadataCallback
} from "../filesystem";
import { Idb } from "./Idb";
import { IdbDirectoryReader } from "./IdbDirectoryReader";
import { IdbEntry } from "./IdbEntry";
import { IdbFileEntry } from "./IdbFileEntry";
import { IdbObject } from "./IdbObject";
import { IdbParams } from "./IdbParams";
import { INVALID_MODIFICATION_ERR, NOT_FOUND_ERR } from "../FileError";

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

export class IdbDirectoryEntry extends IdbEntry implements DirectoryEntry {
  public isFile = false;
  public isDirectory = true;
  public lastModifiedDate: Date;

  constructor(params: IdbParams) {
    super(params);
    this.lastModifiedDate = params.lastModifiedDate;
  }

  createReader(): DirectoryReader {
    return new IdbDirectoryReader(this);
  }

  createFile() {}

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
      .then(obj => {
        if (!options) {
          options = {};
        }

        if (options.create) {
          if (options.exclusive && obj) {
            // If create and exclusive are both true, and the path already exists,
            // getFile must fail.

            onError(INVALID_MODIFICATION_ERR, errorCallback);
          } else if (!obj) {
            // If create is true, the path doesn't exist, and no other error occurs,
            // getFile must create it as a zero-length file and return a corresponding
            // FileEntry.
            const newObj: IdbObject = {
              isFile: true,
              isDirectory: false,
              name: path.split(DIR_SEPARATOR).pop(),
              fullPath: path,
              lastModified: Date.now(),
              content: Idb.SUPPORTS_BLOB ? EMPTY_BLOB : ""
            };

            idb
              .put(newObj)
              .then(() => {
                if (!successCallback) {
                  return;
                }
                successCallback(
                  new IdbFileEntry({
                    filesystem: this.filesystem,
                    name: newObj.name,
                    fullPath: newObj.fullPath,
                    lastModifiedDate: new Date(newObj.lastModified),
                    file: createEmptyFile(newObj.name)
                  })
                );
              })
              .catch(err => {
                onError(err, errorCallback);
              });
          } else if (obj) {
            if (obj.isFile) {
              if (!successCallback) {
                return;
              }
              // IDB won't save methods, so we need re-create the FileEntry.
              successCallback(
                new IdbFileEntry({
                  filesystem: this.filesystem,
                  name: obj.name,
                  fullPath: obj.fullPath,
                  lastModifiedDate: new Date(),
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
              );
            } else {
              onError(INVALID_MODIFICATION_ERR, errorCallback);
            }
          }
        } else {
          if (!obj) {
            // If create is not true and the path doesn't exist, getFile must fail.
            onError(NOT_FOUND_ERR, errorCallback);
          } else if (obj && obj.isDirectory) {
            // If create is not true and the path exists, but is a directory, getFile
            // must fail.
            onError(INVALID_MODIFICATION_ERR, errorCallback);
          } else {
            if (!successCallback) {
              return;
            }

            // Otherwise, if no other error occurs, getFile must return a FileEntry
            // corresponding to path.

            // IDB won't' save methods, so we need re-create the FileEntry.
            successCallback(
              new IdbFileEntry({
                filesystem: this.filesystem,
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
            );
          }
        }
      })
      .catch(err => {
        onError(err, errorCallback);
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
      .then(obj => {
        if (!options) {
          options = {};
        }

        if (options.create) {
          if (options.exclusive && obj) {
            // If create and exclusive are both true, and the path already exists,
            // getDirectory must fail.
            onError(INVALID_MODIFICATION_ERR, errorCallback);
          } else if (!obj) {
            // If create is true, the path doesn't exist, and no other error occurs,
            // getDirectory must create it as a zero-length file and return a corresponding
            // DirectoryEntry.
            const newObj: IdbObject = {
              isFile: false,
              isDirectory: true,
              name: path.split(DIR_SEPARATOR).pop(), // Just need filename.
              fullPath: path,
              lastModified: Date.now()
            };

            idb
              .put(newObj)
              .then(_ => {
                successCallback(
                  new IdbDirectoryEntry({
                    filesystem: this.filesystem,
                    name: newObj.name,
                    fullPath: newObj.fullPath,
                    lastModifiedDate: new Date(newObj.lastModified)
                  })
                );
              })
              .catch(err => {
                onError(err, errorCallback);
              });
          } else if (obj) {
            if (obj.isDirectory) {
              if (!successCallback) {
                return;
              }

              // IDB won't save methods, so we need re-create the DirectoryEntry.
              successCallback(
                new IdbDirectoryEntry({
                  filesystem: this.filesystem,
                  name: obj.name,
                  fullPath: obj.fullPath,
                  lastModifiedDate: new Date(obj.lastModified)
                })
              );
            } else {
              onError(INVALID_MODIFICATION_ERR, errorCallback);
            }
          }
        } else {
          if (!obj) {
            // Handle root special. It should always exist.
            if (path == DIR_SEPARATOR) {
              if (!successCallback) {
                return;
              }

              successCallback(
                new IdbDirectoryEntry({
                  filesystem: this.filesystem,
                  name: "",
                  fullPath: DIR_SEPARATOR,
                  lastModifiedDate: null
                })
              );
            }

            // If create is not true and the path doesn't exist, getDirectory must fail.
            onError(NOT_FOUND_ERR, errorCallback);
          } else if (obj && obj.isFile) {
            // If create is not true and the path exists, but is a file, getDirectory
            // must fail.
            onError(INVALID_MODIFICATION_ERR, errorCallback);
          } else {
            if (!successCallback) {
              return;
            }

            // Otherwise, if no other error occurs, getDirectory must return a
            // DirectoryEntry corresponding to path.

            // IDB won't' save methods, so we need re-create DirectoryEntry.
            successCallback(
              new IdbDirectoryEntry({
                filesystem: this.filesystem,
                name: obj.name,
                fullPath: obj.fullPath,
                lastModifiedDate: new Date(obj.lastModified)
              })
            );
          }
        }
      })
      .catch(err => {
        onError(err, errorCallback);
      });
  }

  getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback
  ): void {
    successCallback({
      modificationTime: this.lastModifiedDate,
      size: 0
    });
  }
}
