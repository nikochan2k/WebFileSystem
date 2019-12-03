import { DIR_SEPARATOR, IdbDirectoryEntry } from "./IdbDirectoryEntry";
import { FileSystem } from "./filesystem";
import { Idb } from "./Idb";

export class IdbFileSystem implements FileSystem {
  name: string;
  root: DirectoryEntry;

  constructor(public idb: Idb) {
    this.root = new IdbDirectoryEntry({
      filesystem: this,
      name: "",
      fullPath: DIR_SEPARATOR
    });
  }
}
