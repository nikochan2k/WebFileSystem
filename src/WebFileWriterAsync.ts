import { FileWriterAsync, FileWriter } from "./filewriter";

export class WebFileWriterAsync implements FileWriterAsync {
  constructor(private fileWriter: FileWriter) {}

  get position() {
    return this.fileWriter.position;
  }

  get length() {
    return this.fileWriter.length;
  }

  write(data: Blob): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.fileWriter.onwriteend = () => {
          this.fileWriter.onwriteend = null;
          resolve();
        };
        this.fileWriter.write(data);
      } catch (err) {
        reject(err);
      }
    });
  }

  seek(offset: number): void {
    this.fileWriter.seek(offset);
  }

  truncate(size: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.fileWriter.onwriteend = () => {
          this.fileWriter.onwriteend = null;
          resolve();
        };
        this.fileWriter.truncate(size);
      } catch (err) {
        reject(err);
      }
    });
  }
}
