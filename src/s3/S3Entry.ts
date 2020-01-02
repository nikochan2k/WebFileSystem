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
import { NOT_IMPLEMENTED_ERR } from "../FileError";
import { S3FileSystem } from "./S3FileSystem";
import { WebFileSystemParams } from "../WebFileSystemParams";

export abstract class S3Entry implements Entry {
  abstract isFile: boolean;
  abstract isDirectory: boolean;
  get name() {
    return this.params.name;
  }
  get fullPath() {
    return this.params.fullPath;
  }
  get filesystem() {
    return this.params.filesystem;
  }

  constructor(public params: WebFileSystemParams<S3FileSystem>) {}

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
    errorCallback(NOT_IMPLEMENTED_ERR);
  }

  moveTo(
    parent: DirectoryEntry,
    newName?: string,
    successCallback?: EntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    throw NOT_IMPLEMENTED_ERR;
  }

  copyTo(
    parent: DirectoryEntry,
    newName?: string,
    successCallback?: EntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    throw NOT_IMPLEMENTED_ERR;
  }

  toURL(): string {
    throw new Error("Method not implemented.");
  }

  abstract remove(
    successCallback: VoidCallback,
    errorCallback?: ErrorCallback
  ): void;

  getParent(
    successCallback: DirectoryEntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    throw new Error("Method not implemented.");
  }
}
