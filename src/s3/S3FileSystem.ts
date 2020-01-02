import { FileSystem, DirectoryEntry } from "../filesystem";
import { S3 } from "aws-sdk";
import { S3DirectoryEntry } from "./S3DirectoryEntry";
import { DIR_SEPARATOR } from "../WebFileSystemConstants";

export class S3FileSystem implements FileSystem {
  isLocal = false;

  name: string;
  root: DirectoryEntry;
  s3: S3;

  constructor(public options: S3.ClientConfiguration, public bucket: string) {
    this.s3 = new S3(options);
    this.root = new S3DirectoryEntry({
      filesystem: this,
      name: "",
      fullPath: DIR_SEPARATOR,
      lastModifiedDate: null,
      size: null,
      hash: null
    });
  }
}
