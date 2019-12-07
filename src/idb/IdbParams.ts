import { IdbFileSystem } from "./IdbFileSystem";

export interface IdbParams {
  filesystem: IdbFileSystem;
  name: string;
  fullPath: string;
  lastModifiedDate: Date;
}
