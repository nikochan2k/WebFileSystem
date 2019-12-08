import { FileEntry, FileEntryAsync, FileSystemAsync } from "./filesystem";
import { FileWriterAsync } from "./filewriter";
import { WebEntryAsync } from "./WebEntryAsync";
import { WebFileWriterAsync } from "./WebFileWriterAsync";

export class WebFileEntryAsync extends WebEntryAsync implements FileEntryAsync {
  constructor(fileSystemAsync: FileSystemAsync, public fileEntry: FileEntry) {
    super(fileSystemAsync, fileEntry);
  }

  createWriter(): Promise<FileWriterAsync> {
    return new Promise<FileWriterAsync>((resolve, reject) => {
      this.fileEntry.createWriter(
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
      this.fileEntry.file(
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
