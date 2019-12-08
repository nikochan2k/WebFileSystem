import {
  DirectoryEntry,
  DirectoryEntryAsync,
  DirectoryReaderAsync,
  FileEntryAsync,
  FileSystemAsync,
  Flags
} from "./filesystem";
import { WebDirectoryReaderAsync } from "./WebDirectoryReaderAsync";
import { WebEntryAsync } from "./WebEntryAsync";
import { WebFileEntryAsync } from "./WebFileEntryAsync";

export class WebDirectoryEntryAsync extends WebEntryAsync
  implements DirectoryEntryAsync {
  constructor(
    fileSystemAsync: FileSystemAsync,
    public directoryEntry: DirectoryEntry
  ) {
    super(fileSystemAsync, directoryEntry);
  }

  createReader(): DirectoryReaderAsync {
    return new WebDirectoryReaderAsync(
      this.fileSystemAsync,
      this.directoryEntry.createReader()
    );
  }

  getFile(path: string, options?: Flags): Promise<FileEntryAsync> {
    return new Promise<FileEntryAsync>((resolve, reject) => {
      this.directoryEntry.getFile(
        path,
        options,
        entry => {
          resolve(new WebFileEntryAsync(this.fileSystemAsync, entry));
        },
        error => {
          reject(error);
        }
      );
    });
  }

  getDirectory(path: string, options?: Flags): Promise<DirectoryEntryAsync> {
    return new Promise<DirectoryEntryAsync>((resolve, reject) => {
      this.directoryEntry.getDirectory(
        path,
        options,
        entry => {
          resolve(new WebDirectoryEntryAsync(this.fileSystemAsync, entry));
        },
        error => {
          reject(error);
        }
      );
    });
  }

  removeRecursively(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.directoryEntry.removeRecursively(
        () => {
          resolve();
        },
        error => {
          reject(error);
        }
      );
    });
  }
}
