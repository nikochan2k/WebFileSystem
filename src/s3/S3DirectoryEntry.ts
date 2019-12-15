import {
  DIR_SEPARATOR,
  EMPTY_ARRAY_BUFFER,
  EMPTY_BLOB
} from "../WebFileSystemConstants";
import {
  DirectoryEntry,
  DirectoryEntryCallback,
  DirectoryReader,
  ErrorCallback,
  Flags,
  MetadataCallback,
  VoidCallback
} from "../filesystem";
import { getKey } from "./S3Util";
import { resolveToFullPath } from "../WebFileSystemUtil";
import { S3DirectoryReader } from "./S3DirectoryReader";
import { S3Entry } from "./S3Entry";
import { S3FileEntry } from "./S3FileEntry";
import { PutObjectRequest } from "aws-sdk/clients/s3";

export class S3DirectoryEntry extends S3Entry implements DirectoryEntry {
  isFile = false;
  isDirectory = true;

  createReader(): DirectoryReader {
    return new S3DirectoryReader(this);
  }

  doGetFile(
    key: string,
    successCallback?: FileEntryCallback,
    errorCallback?: ErrorCallback
  ) {
    const filesystem = this.filesystem;
    filesystem.s3.headObject(
      { Bucket: filesystem.bucket, Key: key },
      (err, data) => {
        if (err) {
          errorCallback(err);
        } else {
          const name = key.split(DIR_SEPARATOR).pop();
          successCallback(
            new S3FileEntry({
              filesystem: filesystem,
              name: name,
              fullPath: DIR_SEPARATOR + key,
              lastModifiedDate: data.LastModified,
              size: data.ContentLength
            })
          );
        }
      }
    );
  }

  getFile(
    path: string,
    options?: Flags,
    successCallback?: FileEntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    path = resolveToFullPath(this.fullPath, path);
    const key = getKey(path);
    if (options.create) {
      const filesystem = this.filesystem;
      const request: PutObjectRequest = {
        Bucket: filesystem.bucket,
        Key: key,
        Body: "",
        ContentType: "application/octet-stream"
      };
      filesystem.s3.putObject(request, err => {
        if (err) {
          errorCallback(err);
          return;
        }
        this.doGetFile(key, successCallback, errorCallback);
      });
    } else {
      this.doGetFile(key, successCallback, errorCallback);
    }
  }

  getDirectory(
    path: string,
    options?: Flags,
    successCallback?: DirectoryEntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    path = resolveToFullPath(this.fullPath, path);
    const name = path.split(DIR_SEPARATOR).pop();
    successCallback(
      new S3DirectoryEntry({
        filesystem: this.filesystem,
        name: name,
        fullPath: path,
        lastModifiedDate: null
      })
    );
  }

  remove(successCallback: VoidCallback, errorCallback?: ErrorCallback): void {
    successCallback(); // NOOP
  }

  removeRecursively(
    successCallback: VoidCallback,
    errorCallback?: ErrorCallback
  ): void {
    this.remove(successCallback); // TODO
  }

  getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback
  ): void {
    successCallback({
      modificationTime: this.lastModifiedDate,
      size: 0
    });
  }
}
