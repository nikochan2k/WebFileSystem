import { DIR_SEPARATOR } from "../WebFileSystemConstants";
import { DirectoryReader, EntriesCallback, ErrorCallback } from "../filesystem";
import { getPrefix } from "./S3Util";
import { S3DirectoryEntry } from "./S3DirectoryEntry";
import { S3Entry } from "./S3Entry";
import { S3FileEntry } from "./S3FileEntry";
import { onError } from "../WebFileSystemUtil";

export class S3DirectoryReader implements DirectoryReader {
  constructor(public dirEntry: S3DirectoryEntry, public used = false) {}

  readEntries(
    successCallback: EntriesCallback,
    errorCallback?: ErrorCallback
  ): void {
    const fullPath = this.dirEntry.fullPath;
    const filesystem = this.dirEntry.filesystem;
    const param: AWS.S3.ListObjectsV2Request = {
      Bucket: filesystem.bucket,
      Delimiter: DIR_SEPARATOR
    };
    const prefix = getPrefix(fullPath);
    if (prefix) {
      param.Prefix = prefix;
    }

    filesystem.s3.listObjectsV2(param, (err, data) => {
      if (err) {
        onError(err, errorCallback);
      } else {
        const entries: S3Entry[] = [];
        for (const content of data.CommonPrefixes) {
          const parts = content.Prefix.split(DIR_SEPARATOR);
          const name = parts[parts.length - 2];
          const newDirEntry = new S3DirectoryEntry({
            filesystem: filesystem,
            name: name,
            fullPath: (fullPath === "/" ? "" : fullPath) + DIR_SEPARATOR + name,
            lastModifiedDate: null,
            size: null
          });
          entries.push(newDirEntry);
        }
        for (const content of data.Contents) {
          const parts = content.Key.split(DIR_SEPARATOR);
          const name = parts[parts.length - 1];
          const newFileEntry = new S3FileEntry({
            filesystem: filesystem,
            name: name,
            fullPath: (fullPath === "/" ? "" : fullPath) + DIR_SEPARATOR + name,
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
