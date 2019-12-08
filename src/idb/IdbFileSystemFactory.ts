import {
  EntryCallback,
  ErrorCallback,
  FileSystemCallback,
  FileSystemFactory
} from "../filesystem";
import { Idb } from "./Idb";
import { NOT_IMPLEMENTED_ERR } from "../FileError";
import { onError } from "./IdbUtil";

export class IdbFileSystemFactory implements FileSystemFactory {
  get TEMPORARY() {
    return window.TEMPORARY;
  }
  get PERSISTENT() {
    return window.PERSISTENT;
  }

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
