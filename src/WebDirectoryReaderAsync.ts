import { createEntry } from "./WebFileSystemUtil";
import {
  DirectoryReaderAsync,
  EntryAsync,
  FileSystemAsync
} from "./filesystem";

export class WebDirectoryReaderAsync implements DirectoryReaderAsync {
  constructor(
    private fileSystemAsync: FileSystemAsync,
    private directoryReader: DirectoryReader
  ) {}

  readEntries(): Promise<EntryAsync[]> {
    return new Promise<EntryAsync[]>((resolve, reject) => {
      this.directoryReader.readEntries(
        entries => {
          resolve(
            entries.map(entry => createEntry(this.fileSystemAsync, entry))
          );
        },
        error => {
          reject(error);
        }
      );
    });
  }
}
