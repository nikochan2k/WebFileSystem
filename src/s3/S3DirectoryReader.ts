import { DIR_SEPARATOR } from "../WebFileSystemConstants";
import { DirectoryReader, EntriesCallback, ErrorCallback } from "../filesystem";
import { getPrefix } from "./S3Util";
import { S3DirectoryEntry } from "./S3DirectoryEntry";
import { S3Entry } from "./S3Entry";
import { S3FileEntry } from "./S3FileEntry";

export class S3DirectoryReader implements DirectoryReader {
  constructor(public dirEntry: S3DirectoryEntry, public used = false) {}

  readEntries(
    successCallback: EntriesCallback,
    errorCallback?: ErrorCallback
  ): void {
    const fullPath = this.dirEntry.fullPath;
    const prefix = getPrefix(fullPath);
    const filesystem = this.dirEntry.filesystem;
    const param: AWS.S3.ListObjectsV2Request = {
      Bucket: filesystem.bucket,
      Delimiter: DIR_SEPARATOR,
      Prefix: prefix
    };
    filesystem.s3.listObjectsV2(param, (err, data) => {
      if (err) {
        errorCallback(err);
      } else {
        const entries: S3Entry[] = [];
        for (const content of data.CommonPrefixes) {
          const parts = content.Prefix.split(DIR_SEPARATOR);
          const name = parts[parts.length - 2];
          const newDirEntry = new S3DirectoryEntry({
            filesystem: filesystem,
            name: name,
            fullPath: fullPath + DIR_SEPARATOR + name,
            lastModifiedDate: null
          });
          entries.push(newDirEntry);
        }
        for (const content of data.Contents) {
          const parts = content.Key.split(DIR_SEPARATOR);
          const name = parts[parts.length - 2];
          const newFileEntry = new S3FileEntry({
            filesystem: filesystem,
            name: name,
            fullPath: fullPath + DIR_SEPARATOR + name,
            lastModifiedDate: content.LastModified,
            size: content.Size
          });
          entries.push(newFileEntry);
        }
        successCallback(entries);
      }
    });
  }
}
