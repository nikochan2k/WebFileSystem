import {
  ErrorCallback,
  FileCallback,
  FileEntry,
  FileWriterCallback,
  MetadataCallback
} from "../filesystem";
import { IdbEntry } from "./IdbEntry";
import { IdbFileSystem } from "./IdbFileSystem";
import { IdbFileWriter } from "./IdbFileWriter";
import { WebFileSystemParams } from "../WebFileSystemParams";

interface IdbFileParams extends WebFileSystemParams<IdbFileSystem> {
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
