import { IdbFileSystem } from "./IdbFileSystem";

export interface EntryParams {
  filesystem: IdbFileSystem;
  name: string;
  fullPath: string;
}
