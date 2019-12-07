import {
  ErrorCallback,
  FileCallback,
  FileEntry,
  FileWriterCallback,
  MetadataCallback
} from "../filesystem";
import { IdbEntry } from "./IdbEntry";
import { IdbFileWriter } from "./IdbFileWriter";
import { IdbParams } from "./IdbParams";

interface IdbFileParams extends IdbParams {
  blob: Blob;
}

export class IdbFileEntry extends IdbEntry implements FileEntry {
  isFile = true;
  isDirectory = false;
  lastModifiedDate: Date;
  blob: Blob;

  constructor(params: IdbFileParams) {
    super(params);
    this.lastModifiedDate = params.lastModifiedDate;
    this.blob = params.blob;
  }

  createWriter(
    successCallback: FileWriterCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    successCallback(new IdbFileWriter(this));
  }

  file(
    successCallback: FileCallback,
    errorCallback?: ErrorCallback | undefined
  ): void {
    successCallback({
      name: this.name,
      lastModified: this.lastModifiedDate.getTime(),
      size: this.blob.size,
      type: this.blob.type,
      slice: this.blob.slice
    });
  }

  getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback
  ): void {
    successCallback({
      modificationTime: this.lastModifiedDate,
      size: this.blob.size
    });
  }
}
