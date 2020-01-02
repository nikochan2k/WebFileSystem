import { base64ToFile, blobToFile, onError } from "../WebFileSystemUtil";
import {
  ErrorCallback,
  FileCallback,
  FileEntry,
  FileWriterCallback
} from "../filesystem";
import { Idb } from "./Idb";
import { IdbEntry } from "./IdbEntry";
import { IdbFileSystem } from "./IdbFileSystem";
import { IdbFileWriter } from "./IdbFileWriter";
import { WebFileSystemParams } from "../WebFileSystemParams";

export class IdbFileEntry extends IdbEntry implements FileEntry {
  isFile = true;
  isDirectory = false;
  get size() {
    return this.params.size;
  }
  private idbFileWriter: IdbFileWriter;

  constructor(params: WebFileSystemParams<IdbFileSystem>) {
    super(params);
  }

  createWriter(
    successCallback: FileWriterCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    if (!this.idbFileWriter) {
      this.file(file => {
        successCallback(this.idbFileWriter);
      }, errorCallback);
    } else {
      successCallback(this.idbFileWriter);
    }
  }

  file(
    successCallback: FileCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    if (this.idbFileWriter) {
      successCallback(this.idbFileWriter.file);
      return;
    }

    const idb = this.filesystem.idb;
    idb
      .getEntry(this.fullPath)
      .then(entry => {
        idb
          .getContent(this.fullPath)
          .then(content => {
            const file = Idb.SUPPORTS_BLOB
              ? blobToFile([content as Blob], entry.name, entry.lastModified)
              : base64ToFile(content as string, entry.name, entry.lastModified);
            this.idbFileWriter = new IdbFileWriter(this, file);
            successCallback(file);
          })
          .catch(error => {
            onError(error, errorCallback);
          });
      })
      .catch(error => {
        onError(error, errorCallback);
      });
  }
}
