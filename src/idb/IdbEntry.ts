import { DIR_SEPARATOR } from "../WebFileSystemConstants";
import {
  DirectoryEntry,
  DirectoryEntryCallback,
  Entry,
  EntryCallback,
  ErrorCallback,
  Metadata,
  MetadataCallback,
  VoidCallback
} from "../filesystem";
import { IdbFileSystem } from "./IdbFileSystem";
import { NOT_IMPLEMENTED_ERR } from "../FileError";
import { onError } from "../WebFileSystemUtil";
import { WebFileSystemParams } from "../WebFileSystemParams";
import { WebFileSystemObject } from "../WebFileSystemObject";

export abstract class IdbEntry implements Entry {
  abstract isFile: boolean;
  abstract isDirectory: boolean;

  get filesystem() {
    return this.params.filesystem;
  }

  get name() {
    return this.params.name;
  }

  get fullPath() {
    return this.params.fullPath;
  }

  constructor(public params: WebFileSystemParams<IdbFileSystem>) {}

  abstract remove(
    successCallback: VoidCallback,
    errorCallback?: ErrorCallback | undefined
  ): void;

  getParent(
    successCallback: DirectoryEntryCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw NOT_IMPLEMENTED_ERR;
  }

  getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback
  ): void {
    successCallback({
      modificationTime:
        this.params.lastModified == null
          ? null
          : new Date(this.params.lastModified),
      size: this.params.size
    });
  }

  setMetadata(
    metadata: Metadata,
    successCallback: VoidCallback,
    errorCallback?: ErrorCallback
  ): void {
    const temp = { ...metadata };
    delete temp["modificationTime"];
    delete temp["size"];
    const lastModified =
      metadata.modificationTime === undefined
        ? this.params.lastModified
        : metadata.modificationTime === null
        ? null
        : metadata.modificationTime.getTime();
    const obj: WebFileSystemObject = {
      ...temp,
      name: this.name,
      fullPath: this.fullPath,
      lastModified: lastModified,
      size: this.params.size
    };
    this.filesystem.idb
      .put(obj)
      .then(() => {
        this.params.lastModified = lastModified;
        successCallback();
      })
      .catch(err => {
        errorCallback(err);
      });
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
    return `filesystem:${location.protocol}:${location.host}:${location.port}${DIR_SEPARATOR}${this.fullPath}`;
  }
}
