import { FileEntry, FileEntryAsync, FileSystemAsync } from "./filesystem";
import { FileWriterAsync } from "./filewriter";
import { WebEntryAsync } from "./WebEntryAsync";
import { WebFileWriterAsync } from "./WebFileWriterAsync";

export class WebFileEntryAsync extends WebEntryAsync<FileEntry>
  implements FileEntryAsync {
  constructor(fileSystemAsync: FileSystemAsync, fileEntry: FileEntry) {
    super(fileSystemAsync, fileEntry);
  }

  createWriter(): Promise<FileWriterAsync> {
    return new Promise<FileWriterAsync>((resolve, reject) => {
      this.entry.createWriter(
        fileWriter => {
          resolve(new WebFileWriterAsync(fileWriter));
        },
        error => {
          reject(error);
        }
      );
    });
  }

  file(): Promise<File> {
    return new Promise((resolve, reject) => {
      this.entry.file(
        file => {
          resolve(file);
        },
        error => {
          reject(error);
        }
      );
    });
  }
}
