import {
  EntryCallback,
  ErrorCallback,
  FileSystemCallback,
  LocalFileSystem
} from "./filesystem";
import { IdbLocalFileSystem } from "./idb/IdbLocalFileSystem";
import { S3LocalFileSystem } from "./s3/S3LocalFileSystem";

if ((window as any).TEMPORARY == null) {
  (window as any).TEMPORARY = 0;
}
if ((window as any).PERSISTENT == null) {
  (window as any).PERSISTENT = 1;
}

export class WebLocalFileSystem implements LocalFileSystem {
  private localFileSystem = {} as LocalFileSystem;

  constructor(bucket: string, provider?: string, options?: any) {
    if (!provider) {
      this.constructNativeFileSystem();
      if (this.localFileSystem.requestFileSystem) {
        return;
      }
      provider = "idb";
    }

    switch (provider) {
      case "native":
        this.constructNativeFileSystem();
        return;
      case "idb":
        this.localFileSystem = new IdbLocalFileSystem(bucket);
        return;
      case "s3":
        this.localFileSystem = new S3LocalFileSystem(bucket, options);
        return;
    }

    throw new Error(`Illegal provider: ${provider}`);
  }

  private constructNativeFileSystem() {
    this.localFileSystem.requestFileSystem =
      (window as any).requestFileSystem ||
      (window as any).webkitRequestFileSystem;
    this.localFileSystem.resolveLocalFileSystemURL = (window as any).resolveLocalFileSystemURL;
    this.localFileSystem.TEMPORARY = (window as any).TEMPORARY;
    this.localFileSystem.PERSISTENT = (window as any).PERSISTENT;
  }

  get TEMPORARY() {
    return (window as any).TEMPORARY;
  }
  get PERSISTENT() {
    return (window as any).PERSISTENT;
  }

  requestFileSystem(
    type: number,
    size: number,
    successCallback: FileSystemCallback,
    errorCallback?: ErrorCallback
  ): void {
    return this.localFileSystem.requestFileSystem(
      type,
      size,
      successCallback,
      errorCallback
    );
  }

  resolveLocalFileSystemURL(
    url: string,
    successCallback: EntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    return this.localFileSystem.resolveLocalFileSystemURL(
      url,
      successCallback,
      errorCallback
    );
  }
}
