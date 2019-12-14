import {
  EntryCallback,
  ErrorCallback,
  FileSystemCallback,
  LocalFileSystem
} from "../filesystem";
import { Idb } from "./Idb";
import { NOT_IMPLEMENTED_ERR } from "../FileError";
import { onError } from "./IdbUtil";
import { AbstractLocalFileSystem } from "../AbstractFileSystemFactory";

export class IdbLocalFileSystem extends AbstractLocalFileSystem {
  requestFileSystem(
    type: number,
    size: number,
    successCallback: FileSystemCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    if (type === this.TEMPORARY) {
      throw new Error("No temporary storage");
    }
    const dbName = `${location.protocol}_${location.host}_${location.port}`;
    const idb = new Idb();
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
