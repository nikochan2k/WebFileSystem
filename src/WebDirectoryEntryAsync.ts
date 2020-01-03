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

export class WebDirectoryEntryAsync extends WebEntryAsync<DirectoryEntry>
  implements DirectoryEntryAsync {
  constructor(
    fileSystemAsync: FileSystemAsync,
    directoryEntry: DirectoryEntry
  ) {
    super(fileSystemAsync, directoryEntry);
  }

  createReader(): DirectoryReaderAsync {
    return new WebDirectoryReaderAsync(
      this.fileSystemAsync,
      this.entry.createReader()
    );
  }

  getFile(path: string, options?: Flags): Promise<FileEntryAsync> {
    return new Promise<FileEntryAsync>((resolve, reject) => {
      this.entry.getFile(
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
      this.entry.getDirectory(
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
      this.entry.removeRecursively(
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
