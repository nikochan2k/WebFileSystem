import { EntryParams } from "./EntryParams";
import { FileEntry } from "./filesystem";
import { IdbFileSystem } from "./IdbFileSystem";

interface FileEntryParams {
  filesystem: IdbFileSystem;
  blob: Blob;
  name: string;
  fullPath: string;
}

export class IdbFileEntry implements FileEntry {
  public isFile = true;
  public isDirectory = false;
  public filesystem: IdbFileSystem;
  public blob: Blob;
  public name: string;
  public fullPath: string;

  constructor(entry: FileEntryParams) {
    this.filesystem = entry.filesystem;
    this.blob = entry.blob;
    this.name = entry.name;
    this.fullPath = entry.fullPath;
  }

  createWriter(
    successCallback: FileWriterCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  file(
    successCallback: FileCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  moveTo(
    parent: DirectoryEntry,
    newName?: string | undefined,
    successCallback?: EntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  copyTo(
    parent: DirectoryEntry,
    newName?: string | undefined,
    successCallback?: EntryCallback | undefined,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  toURL(): string {
    throw new Error("Method not implemented.");
  }

  remove(
    successCallback: VoidCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }

  getParent(
    successCallback: DirectoryEntryCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    throw new Error("Method not implemented.");
  }
}
