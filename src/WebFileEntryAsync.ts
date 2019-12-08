import { FileEntry, FileEntryAsync, FileSystemAsync } from "./filesystem";
import { FileWriter } from "./filewriter";
import { WebEntryAsync } from "./WebEntryAsync";

export class WebFileEntryAsync extends WebEntryAsync implements FileEntryAsync {
  constructor(fileSystemAsync: FileSystemAsync, public fileEntry: FileEntry) {
    super(fileSystemAsync, fileEntry);
  }

  createWriter(): Promise<FileWriter> {
    return new Promise<FileWriter>((resolve, reject) => {
      this.fileEntry.createWriter(
        fileWriter => {
          resolve(fileWriter);
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
