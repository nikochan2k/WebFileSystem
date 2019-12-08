import { FileSystemAsync } from "./filesystem";
import { WebFileEntryAsync } from "./WebFileEntryAsync";
import { WebDirectoryEntryAsync } from "./WebDirectoryEntryAsync";

export function createEntry(fileSystemAsync: FileSystemAsync, entry: Entry) {
  return entry.isFile
    ? new WebFileEntryAsync(fileSystemAsync, entry as FileEntry)
    : new WebDirectoryEntryAsync(fileSystemAsync, entry as DirectoryEntry);
}
