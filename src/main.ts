import {
  EntryCallback,
  ErrorCallback,
  FileSystemCallback,
  LocalFileSystem
} from "./filesystem";
import { IdbGlobal } from "./idb/IdbGlobal";

export class WebFileSystem implements LocalFileSystem {
  private localFileSystem = {} as LocalFileSystem;

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
        this.localFileSystem = new IdbGlobal();
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
    return this.localFileSystem.TEMPORARY;
  }
  get PERSISTENT() {
    return this.localFileSystem.PERSISTENT;
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
