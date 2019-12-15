import {
  EntryAsync,
  FileSystemAsync,
  LocalFileSystemAsync
} from "./filesystem";
import { NOT_IMPLEMENTED_ERR } from "./FileError";
import { WebFileSystemAsync } from "./WebFileSystemAsync";
import { WebLocalFileSystem } from "./WebLocalFileSystem";

export class WebLocalFileSystemAsync implements LocalFileSystemAsync {
  constructor(bucket: string, provider?: string, options?: any) {
    this.fileSystemFactory = new WebLocalFileSystem(bucket, provider, options);
  }

  private fileSystemFactory: WebLocalFileSystem;

  get TEMPORARY() {
    return (window as any).TEMPORARY;
  }

  get PERSISTENT() {
    return (window as any).PERSISTENT;
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
