import { DIR_SEPARATOR } from "./IdbConstants";
import {
  DirectoryEntry,
  DirectoryEntryCallback,
  EntryCallback,
  ErrorCallback,
  MetadataCallback,
  VoidCallback
} from "../filesystem";
import { IdbFileSystem } from "./IdbFileSystem";
import { IdbParams } from "./IdbParams";
import { NOT_IMPLEMENTED_ERR } from "../FileError";
import { onError } from "./IdbUtil";

export abstract class IdbEntry implements Entry {
  abstract isFile: boolean;
  abstract isDirectory: boolean;
  filesystem: IdbFileSystem;
  name: string;
  fullPath: string;

  constructor(entry: IdbParams) {
    this.filesystem = entry.filesystem;
    this.name = entry.name;
    this.fullPath = entry.fullPath;
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
        onError(err, errorCallback);
      });
  }

  getParent(
    successCallback: DirectoryEntryCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw NOT_IMPLEMENTED_ERR;
  }

  removeRecursively(
    successCallback: VoidCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    this.remove(successCallback, errorCallback);
  }

  abstract getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback | undefined
  ): void;

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
}
