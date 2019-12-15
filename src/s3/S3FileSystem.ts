import { FileSystem, DirectoryEntry } from "../filesystem";
import { S3 } from "aws-sdk";
import { S3DirectoryEntry } from "./S3DirectoryEntry";
import { DIR_SEPARATOR } from "../WebFileSystemConstants";

export class S3FileSystem implements FileSystem {
  name: string;
  root: DirectoryEntry;

  constructor(public s3: S3, public bucket: string) {
    this.root = new S3DirectoryEntry({
      filesystem: this,
      name: "",
      fullPath: DIR_SEPARATOR,
      lastModifiedDate: null
    });
  }
}
