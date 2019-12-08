import { FileSystem, FileSystemAsync, DirectoryEntryAsync } from "./filesystem";
import { WebDirectoryEntryAsync } from "./WebDirectoryEntryAsync";

export class WebFileSystemAsync implements FileSystemAsync {
  constructor(private fileSystem: FileSystem) {}

  get name(): string {
    return this.fileSystem.name;
  }

  get root(): DirectoryEntryAsync {
    return new WebDirectoryEntryAsync(this, this.fileSystem.root);
  }
}
