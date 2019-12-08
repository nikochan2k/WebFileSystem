import { FileEntry, FileEntryAsync, FileSystemAsync } from "./filesystem";
import { FileWriter } from "./filewriter";
import { WebEntryAsync } from "./WebEntryAsync";

export class WebFileEntryAsync extends WebEntryAsync implements FileEntryAsync {
  constructor(fileSystemAsync: FileSystemAsync, fileEntry: FileEntry) {
    super(fileSystemAsync, fileEntry);
  }

  isFile = true;
  isDirectory = false;
  private get fileEntry() {
    return this.entry as FileEntry;
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
