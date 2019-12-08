import { WebDirectoryEntryAsync } from "./WebDirectoryEntryAsync";
import { WebFileEntryAsync } from "./WebFileEntryAsync";
import {
  DirectoryEntryAsync,
  Entry,
  EntryAsync,
  FileSystemAsync,
  Metadata
} from "./filesystem";

export function createEntry(fileSystemAsync: FileSystemAsync, entry: Entry) {
  return entry.isFile
    ? new WebFileEntryAsync(fileSystemAsync, entry as FileEntry)
    : new WebDirectoryEntryAsync(this.fileSystemAsync, entry as DirectoryEntry);
}

export abstract class WebEntryAsync implements EntryAsync {
  constructor(
    protected fileSystemAsync: FileSystemAsync,
    protected entry: Entry
  ) {}

  abstract isFile: boolean;
  abstract isDirectory: boolean;
  get name() {
    return this.entry.name;
  }
  get fullPath() {
    return this.entry.fullPath;
  }
  get filesystem() {
    return this.fileSystemAsync;
  }

  getMetadata(): Promise<Metadata> {
    return new Promise<Metadata>((resolve, reject) => {
      this.entry.getMetadata(
        metadata => {
          resolve(metadata);
        },
        error => {
          reject(error);
        }
      );
    });
  }

  moveTo(parent: DirectoryEntryAsync, newName?: string): Promise<EntryAsync> {
    return new Promise<EntryAsync>((resolve, reject) => {
      this.entry.moveTo(
        parent,
        newName,
        entry => {
          resolve(createEntry(this.fileSystemAsync, entry));
        },
        error => {
          reject(error);
        }
      );
    });
  }

  copyTo(parent: DirectoryEntryAsync, newName?: string): Promise<EntryAsync> {
    return new Promise<EntryAsync>((resolve, reject) => {
      this.entry.copyTo(
        parent,
        newName,
        entry => {
          resolve(createEntry(this.fileSystemAsync, entry));
        },
        error => {
          reject(error);
        }
      );
    });
  }

  toURL(): string {
    return this.entry.toURL();
  }

  remove(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.entry.remove(
        () => {
          resolve();
        },
        error => {
          reject(error);
        }
      );
    });
  }

  getParent(): Promise<DirectoryEntryAsync> {
    return new Promise<DirectoryEntryAsync>((resolve, reject) => {
      this.entry.getParent(
        entry => {
          resolve(new WebDirectoryEntryAsync(this.fileSystemAsync, entry));
        },
        error => {
          reject(error);
        }
      );
    });
  }
}
