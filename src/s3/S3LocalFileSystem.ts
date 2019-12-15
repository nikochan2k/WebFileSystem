import { AbstractLocalFileSystem } from "../AbstractLocalFileSystem";
import { S3 } from "aws-sdk";
import { NOT_IMPLEMENTED_ERR } from "../FileError";

export class S3LocalFileSystem extends AbstractLocalFileSystem {
  private s3: S3;

  constructor(bucket: string, options: any) {
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
  }

  resolveLocalFileSystemURL(
    url: string,
    successCallback: EntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    throw NOT_IMPLEMENTED_ERR;
  }
}
