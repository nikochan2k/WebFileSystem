import { DIR_SEPARATOR } from "../WebFileSystemConstants";
import { FileSystem } from "../filesystem";
import { Idb } from "./Idb";
import { IdbDirectoryEntry } from "./IdbDirectoryEntry";

export class IdbFileSystem implements FileSystem {
  name: string;
  root: IdbDirectoryEntry;

  constructor(public idb: Idb) {
    this.root = new IdbDirectoryEntry({
      filesystem: this,
      name: "",
      fullPath: DIR_SEPARATOR,
      lastModifiedDate: null,
      size: null
    });
  }
}
