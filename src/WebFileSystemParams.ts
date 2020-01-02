import { FileSystem } from "./filesystem";
import { WebFileSystemObject } from "./WebFileSystemObject";

export interface WebFileSystemParams<FS extends FileSystem>
  extends WebFileSystemObject {
  filesystem: FS;
}
