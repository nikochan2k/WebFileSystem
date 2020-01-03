import { createEntry } from "./WebFileSystemUtil";
import {
  DirectoryEntryAsync,
  Entry,
  EntryAsync,
  FileSystemAsync,
  Metadata
} from "./filesystem";
import { WebDirectoryEntryAsync } from "./WebDirectoryEntryAsync";

export abstract class WebEntryAsync<T extends Entry> implements EntryAsync {
  constructor(
    protected fileSystemAsync: FileSystemAsync,
    protected entry: T
  ) {}

  get isFile() {
    return this.entry.isFile;
  }
  get isDirectory() {
    return this.entry.isDirectory;
  }
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

  setMetadata(metadata: Metadata): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.entry.setMetadata(
        metadata,
        () => {
          resolve();
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
