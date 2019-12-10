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
  file: File;
}

export class IdbFileEntry extends IdbEntry implements FileEntry {
  isFile = true;
  isDirectory = false;
  file_: File;

  constructor(params: IdbFileParams) {
    super(params);
    this.file_ = params.file;
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
    successCallback(this.file_);
  }

  getMetadata(
    successCallback: MetadataCallback,
    errorCallback?: ErrorCallback
  ): void {
    successCallback({
      modificationTime: new Date(this.file_.lastModified),
      size: this.file_.size
    });
  }
}
