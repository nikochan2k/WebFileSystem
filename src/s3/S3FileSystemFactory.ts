import { AbstractFileSystemFactory } from "../AbstractFileSystemFactory";

export class S3FileSystemFactory extends AbstractFileSystemFactory {
  requestFileSystem(
    type: number,
    size: number,
    successCallback: FileSystemCallback,
    errorCallback?: ErrorCallback
  ): void {
    throw new Error("Method not implemented.");
  }

  resolveLocalFileSystemURL(
    url: string,
    successCallback: EntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    throw new Error("Method not implemented.");
  }
}
