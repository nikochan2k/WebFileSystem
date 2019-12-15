import { AbstractFileWriter } from "../AbstractFileWriter";
import { FileWriter } from "../filewriter";
import { getKey } from "./S3Util";
import { S3FileEntry } from "./S3FileEntry";

export class S3FileWriter extends AbstractFileWriter implements FileWriter {
  constructor(private s3FileEntry: S3FileEntry) {
    super(s3FileEntry);
  }

  get file() {
    return this.s3FileEntry.file_;
  }

  set file(file: File) {
    this.s3FileEntry.file_ = file;
  }

  doWrite(data: Blob) {
    const filesystem = this.s3FileEntry.filesystem;
    const key = getKey(this.s3FileEntry.fullPath);
    if (this.onwritestart) {
      this.onwritestart(null); // TODO
    }
    filesystem.s3.putObject(
      { Bucket: filesystem.bucket, Key: key, Body: this.file },
      err => {
        if (err) {
          console.error(err);
          return;
        }
        this.position += data.size;
        if (this.onwriteend) {
          this.onwriteend(null); // TODO
        }
      }
    );
  }
}
