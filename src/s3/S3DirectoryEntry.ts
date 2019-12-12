import {
  DirectoryEntryCallback,
  Entry,
  ErrorCallback,
  FileSystem,
  MetadataCallback,
  VoidCallback
} from "../filesystem";

export abstract class S3Entry implements Entry {
  abstract isFile: boolean;
  abstract isDirectory: boolean;
  name: string;
  fullPath: string;
  filesystem: FileSystem;

  getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback
  ): void {
    throw new Error("Method not implemented.");
  }

  moveTo(
    parent: DirectoryEntry,
    newName?: string,
    successCallback?: EntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    throw new Error("Method not implemented.");
  }
  copyTo(
    parent: DirectoryEntry,
    newName?: string,
    successCallback?: EntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    throw new Error("Method not implemented.");
  }

  toURL(): string {
    throw new Error("Method not implemented.");
  }

  remove(successCallback: VoidCallback, errorCallback?: ErrorCallback): void {
    throw new Error("Method not implemented.");
  }

  getParent(
    successCallback: DirectoryEntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    throw new Error("Method not implemented.");
  }
}
