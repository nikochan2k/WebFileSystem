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
import { INVALID_MODIFICATION_ERR, NOT_FOUND_ERR } from "../FileError";
import { WebFileSystemParams } from "../WebFileSystemParams";
import { WebFileSystemObject } from "../WebFileSystemObject";

export class IdbDirectoryEntry extends IdbEntry implements DirectoryEntry {
  public isFile = false;
  public isDirectory = true;

  constructor(params: WebFileSystemParams<IdbFileSystem>) {
    super(params);
  }

  createReader(): DirectoryReader {
    return new IdbDirectoryReader(this);
  }

  doCreateObject(
    isFile: boolean,
    path: string,
    successCallback: FileEntryCallback | DirectoryEntryCallback,
    errorCallback?: ErrorCallback
  ) {
    const newObj: WebFileSystemObject = {
      name: path.split(DIR_SEPARATOR).pop(),
      fullPath: path,
      lastModified: Date.now(),
      size: isFile ? 0 : null,
      hash: null
    };

    const idb = this.filesystem.idb;
    idb
      .put(newObj)
      .then(() => {
        if (isFile) {
          (successCallback as FileEntryCallback)(
            new IdbFileEntry({
              filesystem: this.filesystem,
              ...newObj
            })
          );
        } else {
          (successCallback as DirectoryEntryCallback)(
            new IdbDirectoryEntry({
              filesystem: this.filesystem,
              ...newObj
            })
          );
        }
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
      .then(obj => {
        if (!options) {
          options = {};
        }
        if (!successCallback) {
          successCallback = () => {};
        }

        if (obj) {
          if (obj.size == null) {
            onError(INVALID_MODIFICATION_ERR, errorCallback);
            return;
          }
          if (options.create) {
            if (options.exclusive) {
              onError(INVALID_MODIFICATION_ERR, errorCallback);
              return;
            }

            this.doCreateObject(true, path, successCallback, errorCallback);
          } else {
            successCallback(
              new IdbFileEntry({
                filesystem: this.filesystem,
                ...obj
              })
            );
          }
        } else {
          if (options.create) {
            this.doCreateObject(true, path, successCallback, errorCallback);
          } else {
            onError(NOT_FOUND_ERR, errorCallback);
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
      .then(obj => {
        if (!options) {
          options = {};
        }
        if (!successCallback) {
          successCallback = () => {};
        }

        if (obj) {
          if (obj.size != null) {
            onError(INVALID_MODIFICATION_ERR, errorCallback);
            return;
          }

          if (options.create) {
            if (options.exclusive) {
              onError(INVALID_MODIFICATION_ERR, errorCallback);
              return;
            }

            this.doCreateObject(false, path, successCallback, errorCallback);
          } else {
            successCallback(
              new IdbDirectoryEntry({
                filesystem: this.filesystem,
                ...obj
              })
            );
          }
        } else {
          if (options.create) {
            this.doCreateObject(false, path, successCallback, errorCallback);
          } else {
            onError(NOT_FOUND_ERR, errorCallback);
          }
        }
      })
      .catch(err => {
        onError(err, errorCallback);
      });
  }
}
