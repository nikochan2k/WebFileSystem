import { AbstractLocalFileSystem } from "../AbstractLocalFileSystem";
import {
  EntryCallback,
  ErrorCallback,
  FileSystemCallback
} from "../filesystem";
import { NOT_IMPLEMENTED_ERR } from "../FileError";
import { S3 } from "aws-sdk";
import { S3FileSystem } from "./S3FileSystem";

export class S3LocalFileSystem extends AbstractLocalFileSystem {
  constructor(bucket: string, private options: S3.ClientConfiguration) {
    super(bucket);
  }

  requestFileSystem(
    type: number,
    size: number,
    successCallback: FileSystemCallback,
    errorCallback?: ErrorCallback
  ): void {
    if (type === this.TEMPORARY) {
      throw new Error("No temporary storage");
    }

    try {
      const s3FileSystem = new S3FileSystem(this.options, this.bucket);
      successCallback(s3FileSystem);
    } catch (err) {
      errorCallback(err);
    }
  }

  resolveLocalFileSystemURL(
    url: string,
    successCallback: EntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    throw NOT_IMPLEMENTED_ERR;
  }
}
