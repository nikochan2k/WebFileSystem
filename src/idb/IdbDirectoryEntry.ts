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

  doCreateFile(
    path: string,
    successCallback: FileEntryCallback,
    errorCallback?: ErrorCallback
  ) {
    const newEntry: IdbObject = {
      isFile: true,
      isDirectory: false,
      name: path.split(DIR_SEPARATOR).pop(),
      fullPath: path,
      lastModified: Date.now(),
      size: 0
    };

    const idb = this.filesystem.idb;
    idb
      .put(newEntry)
      .then(() => {
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
  }

  getFile(
    path: string,
    options?: Flags | undefined,
    successCallback?: FileEntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    path = resolveToFullPath(this.fullPath, path);
    const idb = this.filesystem.idb;
    idb
      .getEntry(path)
      .then(entry => {
        if (!options) {
          options = {};
        }
        if (!successCallback) {
          successCallback = () => {};
        }

        if (entry) {
          if (options.create) {
            if (options.exclusive) {
              onError(INVALID_MODIFICATION_ERR, errorCallback);
              return;
            }
            if (entry.isDirectory) {
              onError(INVALID_MODIFICATION_ERR, errorCallback);
              return;
            }

            this.doCreateFile(path, successCallback, errorCallback);
          } else {
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
        } else {
          if (options.create) {
            this.doCreateFile(path, successCallback, errorCallback);
          } else {
            onError(NOT_FOUND_ERR, errorCallback);
          }
        }
      })
      .catch(err => {
        onError(err, errorCallback);
      });
  }

  doCreateDirectory(
    path: string,
    successCallback: DirectoryEntryCallback,
    errorCallback?: ErrorCallback
  ) {
    const newEntry: IdbObject = {
      isFile: true,
      isDirectory: false,
      name: path.split(DIR_SEPARATOR).pop(),
      fullPath: path,
      lastModified: Date.now(),
      size: null
    };

    const idb = this.filesystem.idb;
    idb
      .put(newEntry)
      .then(() => {
        successCallback(
          new IdbDirectoryEntry({
            filesystem: this.filesystem,
            name: newEntry.name,
            fullPath: newEntry.fullPath,
            lastModifiedDate: new Date(newEntry.lastModified),
            size: null
          })
        );
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
        if (!successCallback) {
          successCallback = () => {};
        }

        if (entry) {
          if (options.create) {
            if (options.exclusive) {
              onError(INVALID_MODIFICATION_ERR, errorCallback);
              return;
            }
            if (entry.isFile) {
              onError(INVALID_MODIFICATION_ERR, errorCallback);
              return;
            }

            this.doCreateDirectory(path, successCallback, errorCallback);
          } else {
            successCallback(
              new IdbDirectoryEntry({
                filesystem: this.filesystem,
                name: entry.name,
                fullPath: entry.fullPath,
                lastModifiedDate: new Date(entry.lastModified),
                size: null
              })
            );
          }
        } else {
          if (options.create) {
            this.doCreateDirectory(path, successCallback, errorCallback);
          } else {
            onError(NOT_FOUND_ERR, errorCallback);
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
