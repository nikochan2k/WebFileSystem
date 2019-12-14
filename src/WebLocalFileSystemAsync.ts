import {
  EntryAsync,
  FileSystemAsync,
  LocalFileSystemAsync
} from "./filesystem";
import { NOT_IMPLEMENTED_ERR } from "./FileError";
import { WebFileSystemAsync } from "./WebFileSystemAsync";
import { WebLocalFileSystem } from "./WebLocalFileSystem";

export class WebFileSystemAsyncFactory implements LocalFileSystemAsync {
  constructor(provider?: string, options?: any) {
    this.fileSystemFactory = new WebLocalFileSystem(provider, options);
  }

  private fileSystemFactory: WebLocalFileSystem;

  get TEMPORARY() {
    return window.TEMPORARY;
  }

  get PERSISTENT() {
    return window.PERSISTENT;
  }

  requestFileSystemAsync(type: number, size: number): Promise<FileSystemAsync> {
    return new Promise<FileSystemAsync>((resolve, reject) => {
      this.fileSystemFactory.requestFileSystem(
        type,
        size,
        filesystem => {
          resolve(new WebFileSystemAsync(filesystem));
        },
        error => {
          reject(error);
        }
      );
    });
  }

  resolveLocalFileSystemAsyncURL(url: string): Promise<EntryAsync> {
    throw NOT_IMPLEMENTED_ERR;
  }
}
