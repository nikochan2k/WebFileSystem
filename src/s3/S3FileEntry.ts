import { blobToFile } from "../WebFileSystemUtil";
import {
  ErrorCallback,
  FileCallback,
  FileEntry,
  FileWriterCallback,
  MetadataCallback,
  VoidCallback
} from "../filesystem";
import { getKey } from "./S3Util";
import { S3Entry } from "./S3Entry";
import { S3FileSystem } from "./S3FileSystem";
import { S3FileWriter } from "./S3FileWriter";
import { WebFileSystemParams } from "../WebFileSystemParams";

export interface S3FileParams extends WebFileSystemParams<S3FileSystem> {
  size: number;
}

export class S3FileEntry extends S3Entry implements FileEntry {
  isFile = true;
  isDirectory = false;
  size: number;
  private s3FileWriter: S3FileWriter;

  constructor(params: S3FileParams) {
    super(params);
    this.size = params.size;
  }

  createWriter(
    successCallback: FileWriterCallback,
    errorCallback?: ErrorCallback
  ): void {
    if (!this.s3FileWriter) {
      this.file(file => {
        successCallback(this.s3FileWriter);
      }, errorCallback);
    } else {
      successCallback(this.s3FileWriter);
    }
  }

  file(successCallback: FileCallback, errorCallback?: ErrorCallback): void {
    if (this.s3FileWriter) {
      successCallback(this.s3FileWriter.file);
      return;
    }
    const filesystem = this.filesystem;
    filesystem.s3.getObject(
      { Bucket: filesystem.bucket, Key: getKey(this.fullPath) },
      (err, data) => {
        if (err) {
          errorCallback(err);
        } else {
          this.size = data.ContentLength;
          const body = data.Body;
          if (
            body instanceof Buffer ||
            body instanceof ArrayBuffer ||
            body instanceof Blob ||
            typeof body === "string"
          ) {
            const file = blobToFile(
              [body],
              this.name,
              this.lastModifiedDate.getTime(),
              data.ContentType
            );
            this.s3FileWriter = new S3FileWriter(this, file);
            successCallback(file);
          } else {
            errorCallback(new Error("Unknown data type"));
          }
        }
      }
    );
  }

  getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback
  ): void {
    successCallback({
      modificationTime: this.lastModifiedDate,
      size: this.size
    });
  }

  remove(successCallback: VoidCallback, errorCallback?: ErrorCallback): void {
    const key = getKey(this.fullPath);
    this.filesystem.s3.deleteObject(
      { Bucket: this.filesystem.bucket, Key: key },
      err => {
        if (err) {
          errorCallback(err);
        } else {
          successCallback();
        }
      }
    );
  }
}
