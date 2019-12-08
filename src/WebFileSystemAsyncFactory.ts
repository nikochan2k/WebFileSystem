import {
  EntryAsync,
  FileSystemAsync,
  LocalFileSystemAsync
} from "./filesystem";
import { NOT_IMPLEMENTED_ERR } from "./FileError";
import { WebFileSystemAsync } from "./WebFileSystemAsync";
import { WebFileSystemFactory } from "./WebFileSystemFactory";

export class WebFileSystemAsyncFactory implements LocalFileSystemAsync {
  constructor(provider?: string, options?: any) {
    this.fileSystemFactory = new WebFileSystemFactory(provider, options);
  }

  private fileSystemFactory: WebFileSystemFactory;

  get TEMPORARY() {
    return this.fileSystemFactory.TEMPORARY;
  }

  get PERSISTENT() {
    return this.fileSystemFactory.PERSISTENT;
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
