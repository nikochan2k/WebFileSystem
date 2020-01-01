import { onError, resolveToFullPath } from "../WebFileSystemUtil";
import { DIR_SEPARATOR } from "../WebFileSystemConstants";
import {
  DirectoryEntry,
  DirectoryEntryCallback,
  DirectoryReader,
  ErrorCallback,
  FileEntryCallback,
  Flags,
  MetadataCallback
} from "../filesystem";
import { IdbDirectoryReader } from "./IdbDirectoryReader";
import { IdbEntry } from "./IdbEntry";
import { IdbFileEntry } from "./IdbFileEntry";
import { IdbFileSystem } from "./IdbFileSystem";
import { IdbObject } from "./IdbObject";
import { INVALID_MODIFICATION_ERR, NOT_FOUND_ERR } from "../FileError";
import { WebFileSystemParams } from "../WebFileSystemParams";

export class IdbDirectoryEntry extends IdbEntry implements DirectoryEntry {
  public isFile = false;
  public isDirectory = true;
  public lastModifiedDate: Date;

  constructor(params: WebFileSystemParams<IdbFileSystem>) {
    super(params);
    this.lastModifiedDate = params.lastModifiedDate;
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
      .getEntry(path)
      .then(entry => {
        if (!options) {
          options = {};
        }

        if (options.create) {
          if (options.exclusive && entry) {
            // If create and exclusive are both true, and the path already exists,
            // getFile must fail.

            onError(INVALID_MODIFICATION_ERR, errorCallback);
          } else if (!entry) {
            // If create is true, the path doesn't exist, and no other error occurs,
            // getFile must create it as a zero-length file and return a corresponding
            // FileEntry.
            const newEntry: IdbObject = {
              isFile: true,
              isDirectory: false,
              name: path.split(DIR_SEPARATOR).pop(),
              fullPath: path,
              lastModified: Date.now(),
              size: 0
            };

            idb
              .put(newEntry)
              .then(() => {
                if (!successCallback) {
                  return;
                }
                successCallback(
                  new IdbFileEntry({
                    filesystem: this.filesystem,
                    name: newEntry.name,
                    fullPath: newEntry.fullPath,
                    lastModifiedDate: new Date(newEntry.lastModified),
                    size: 0
                  })
                );
              })
              .catch(err => {
                onError(err, errorCallback);
              });
          } else if (entry) {
            if (entry.isFile) {
              if (!successCallback) {
                return;
              }
              // IDB won't save methods, so we need re-create the FileEntry.
              successCallback(
                new IdbFileEntry({
                  filesystem: this.filesystem,
                  name: entry.name,
                  fullPath: entry.fullPath,
                  lastModifiedDate: new Date(),
                  size: 0
                })
              );
            } else {
              onError(INVALID_MODIFICATION_ERR, errorCallback);
            }
          }
        } else {
          if (!entry) {
            // If create is not true and the path doesn't exist, getFile must fail.
            onError(NOT_FOUND_ERR, errorCallback);
          } else if (entry && entry.isDirectory) {
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
                name: entry.name,
                fullPath: entry.fullPath,
                lastModifiedDate: new Date(entry.lastModified),
                size: 0
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
      .getEntry(path)
      .then(entry => {
        if (!options) {
          options = {};
        }

        if (options.create) {
          if (options.exclusive && entry) {
            // If create and exclusive are both true, and the path already exists,
            // getDirectory must fail.
            onError(INVALID_MODIFICATION_ERR, errorCallback);
          } else if (!entry) {
            // If create is true, the path doesn't exist, and no other error occurs,
            // getDirectory must create it as a zero-length file and return a corresponding
            // DirectoryEntry.
            const newEntry: IdbObject = {
              isFile: false,
              isDirectory: true,
              name: path.split(DIR_SEPARATOR).pop(), // Just need filename.
              fullPath: path,
              lastModified: Date.now()
            };

            idb
              .put(newEntry)
              .then(_ => {
                if (!successCallback) {
                  return;
                }

                successCallback(
                  new IdbDirectoryEntry({
                    filesystem: this.filesystem,
                    name: newEntry.name,
                    fullPath: newEntry.fullPath,
                    lastModifiedDate:
                      newEntry.lastModified == null
                        ? null
                        : new Date(newEntry.lastModified),
                    size: null
                  })
                );
              })
              .catch(err => {
                onError(err, errorCallback);
              });
          } else if (entry) {
            if (entry.isDirectory) {
              if (!successCallback) {
                return;
              }

              // IDB won't save methods, so we need re-create the DirectoryEntry.
              successCallback(
                new IdbDirectoryEntry({
                  filesystem: this.filesystem,
                  name: entry.name,
                  fullPath: entry.fullPath,
                  lastModifiedDate:
                    entry.lastModified == null
                      ? null
                      : new Date(entry.lastModified),
                  size: null
                })
              );
            } else {
              onError(INVALID_MODIFICATION_ERR, errorCallback);
            }
          }
        } else {
          if (!entry) {
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
                  lastModifiedDate: null,
                  size: null
                })
              );
            }

            // If create is not true and the path doesn't exist, getDirectory must fail.
            onError(NOT_FOUND_ERR, errorCallback);
          } else if (entry && entry.isFile) {
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
                name: entry.name,
                fullPath: entry.fullPath,
                lastModifiedDate:
                  entry.lastModified == null
                    ? null
                    : new Date(entry.lastModified),
                size: null
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
      size: null
    });
  }
}
