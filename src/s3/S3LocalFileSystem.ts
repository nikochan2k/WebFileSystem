import { AbstractLocalFileSystem } from "../AbstractLocalFileSystem";

export class S3LocalFileSystem extends AbstractLocalFileSystem {
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
