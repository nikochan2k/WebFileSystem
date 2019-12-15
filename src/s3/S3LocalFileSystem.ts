import { AbstractLocalFileSystem } from "../AbstractLocalFileSystem";
import { S3 } from "aws-sdk";
import { NOT_IMPLEMENTED_ERR } from "../FileError";
import { S3FileSystem } from "./S3FileSystem";

export class S3LocalFileSystem extends AbstractLocalFileSystem {
  private s3: S3;

  constructor(bucket: string, options: S3.ClientConfiguration) {
    super(bucket);
    this.s3 = new S3(options);
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

    const s3FileSystem = new S3FileSystem(this.s3, this.bucket);
    successCallback(s3FileSystem);
  }

  resolveLocalFileSystemURL(
    url: string,
    successCallback: EntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    throw NOT_IMPLEMENTED_ERR;
  }
}
