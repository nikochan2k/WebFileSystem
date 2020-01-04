import {
  EntryAsync,
  FileSystemAsync,
  LocalFileSystemAsync,
  LocalFileSystem
} from "./filesystem";
import { NotImplementedError } from "./FileError";
import { WebFileSystemAsync } from "./WebFileSystemAsync";

export class WebLocalFileSystemAsync implements LocalFileSystemAsync {
  constructor(public localFileSystem: LocalFileSystem) {}

  get TEMPORARY() {
    return window.TEMPORARY;
  }

  get PERSISTENT() {
    return window.PERSISTENT;
  }

  requestFileSystemAsync(type: number, size: number): Promise<FileSystemAsync> {
    return new Promise<FileSystemAsync>((resolve, reject) => {
      this.localFileSystem.requestFileSystem(
        type,
        size,
        filesystem => {
          resolve(new WebFileSystemAsync(filesystem));
        },
        err => {
          reject(err);
        }
      );
    });
  }

  resolveLocalFileSystemAsyncURL(url: string): Promise<EntryAsync> {
    throw new NotImplementedError("", url);
  }
}
