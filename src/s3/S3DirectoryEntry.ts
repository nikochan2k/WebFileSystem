import { DIR_SEPARATOR } from "../WebFileSystemConstants";
import {
  DirectoryEntry,
  DirectoryEntryCallback,
  DirectoryReader,
  ErrorCallback,
  FileEntryCallback,
  Flags,
  MetadataCallback,
  VoidCallback
} from "../filesystem";
import { getKey } from "./S3Util";
import { NOT_FOUND_ERR, INVALID_MODIFICATION_ERR } from "../FileError";
import { PutObjectRequest } from "aws-sdk/clients/s3";
import { resolveToFullPath, onError } from "../WebFileSystemUtil";
import { S3DirectoryReader } from "./S3DirectoryReader";
import { S3Entry } from "./S3Entry";
import { S3FileEntry } from "./S3FileEntry";

export class S3DirectoryEntry extends S3Entry implements DirectoryEntry {
  isFile = false;
  isDirectory = true;

  createReader(): DirectoryReader {
    return new S3DirectoryReader(this);
  }

  doGetFile(
    key: string,
    successCallback: FileEntryCallback,
    errorCallback?: ErrorCallback
  ) {
    const filesystem = this.filesystem;
    filesystem.s3.headObject(
      { Bucket: filesystem.bucket, Key: key },
      (err, data) => {
        if (err) {
          if (err.statusCode === 404) {
            onError(NOT_FOUND_ERR, errorCallback);
          } else {
            onError(err, errorCallback);
          }
        } else {
          const name = key.split(DIR_SEPARATOR).pop();
          successCallback(
            new S3FileEntry({
              filesystem: this.filesystem,
              name: name,
              fullPath: DIR_SEPARATOR + key,
              lastModified: data.LastModified.getTime(),
              size: data.ContentLength
            })
          );
        }
      }
    );
  }

  doCrateFile(
    key: string,
    successCallback: FileEntryCallback,
    errorCallback?: ErrorCallback
  ) {
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
  }

  getFile(
    path: string,
    options?: Flags,
    successCallback?: FileEntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    if (!options) {
      options = {};
    }
    if (!successCallback) {
      successCallback = () => {};
    }

    path = resolveToFullPath(this.fullPath, path);
    const key = getKey(path);
    this.doGetFile(
      key,
      entry => {
        if (entry.isDirectory) {
          onError(INVALID_MODIFICATION_ERR, errorCallback);
          return;
        }
        if (options.create && options.exclusive) {
          onError(INVALID_MODIFICATION_ERR, errorCallback);
          return;
        }
        successCallback(entry);
      },
      err => {
        if (err === NOT_FOUND_ERR && options.create) {
          this.doCrateFile(key, successCallback, errorCallback);
        } else {
          onError(err, errorCallback);
        }
      }
    );
  }

  getDirectory(
    path: string,
    options?: Flags,
    successCallback?: DirectoryEntryCallback,
    errorCallback?: ErrorCallback
  ): void {
    if (!successCallback) {
      successCallback = () => {};
    }

    // TODO incomplete
    path = resolveToFullPath(this.fullPath, path);
    const name = path.split(DIR_SEPARATOR).pop();
    successCallback(
      new S3DirectoryEntry({
        filesystem: this.filesystem,
        name: name,
        fullPath: path,
        lastModified: null,
        size: null,
        hash: null
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
}
