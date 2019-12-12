import {
  EntryCallback,
  ErrorCallback,
  FileSystemCallback,
  FileSystemFactory
} from "./filesystem";
import { IdbFileSystemFactory } from "./idb/IdbFileSystemFactory";

if (window.TEMPORARY == null) {
  window.TEMPORARY = 0;
}
if (window.PERSISTENT == null) {
  window.PERSISTENT = 1;
}

export class WebFileSystemFactory implements FileSystemFactory {
  private localFileSystem = {} as FileSystemFactory;

  constructor(provider?: string, options?: any) {
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
        this.localFileSystem = new IdbFileSystemFactory();
        return;
    }

    throw new Error(`Illegal provider: ${provider}`);
  }

  private constructNativeFileSystem() {
    this.localFileSystem.requestFileSystem =
      window.requestFileSystem || window.webkitRequestFileSystem;
    this.localFileSystem.resolveLocalFileSystemURL =
      window.resolveLocalFileSystemURL;
    this.localFileSystem.TEMPORARY = window.TEMPORARY;
    this.localFileSystem.PERSISTENT = window.PERSISTENT;
  }

  get TEMPORARY() {
    return window.TEMPORARY;
  }
  get PERSISTENT() {
    return window.PERSISTENT;
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