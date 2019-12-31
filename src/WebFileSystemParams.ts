import { FileSystem } from "./filesystem";

export interface WebFileSystemParams<FS extends FileSystem> {
  filesystem: FS;
  name: string;
  fullPath: string;
  lastModifiedDate: Date;
  size: number;
}
