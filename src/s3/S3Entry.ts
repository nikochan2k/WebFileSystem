import {
  DirectoryEntryCallback,
  Entry,
  ErrorCallback,
  MetadataCallback,
  VoidCallback
} from "../filesystem";
import { NOT_IMPLEMENTED_ERR } from "../FileError";
import { S3FileSystem } from "./S3FileSystem";
import { WebFileSystemParams } from "../WebFileSystemParams";

export abstract class S3Entry implements Entry {
  abstract isFile: boolean;
  abstract isDirectory: boolean;
  name: string;
  fullPath: string;
  filesystem: S3FileSystem;
  lastModifiedDate: Date;

  constructor(params: WebFileSystemParams<S3FileSystem>) {
    this.filesystem = params.filesystem;
    this.name = params.name;
    this.fullPath = params.fullPath;
    this.lastModifiedDate = params.lastModifiedDate;
  }

  abstract getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback
  ): void;

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
