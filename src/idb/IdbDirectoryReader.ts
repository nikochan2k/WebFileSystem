import { DirectoryReader, EntriesCallback, ErrorCallback } from "../filesystem";
import { IdbDirectoryEntry } from "./IdbDirectoryEntry";
import { onError } from "./IdbUtil";

export class IdbDirectoryReader implements DirectoryReader {
  constructor(public dirEntry: IdbDirectoryEntry, public used = false) {}

  readEntries(
    successCallback: EntriesCallback,
    errorCallback?: ErrorCallback
  ): void {
    // This is necessary to mimic the way DirectoryReader.readEntries() should
    // normally behavior.  According to spec, readEntries() needs to be called
    // until the length of result array is 0. To handle someone implementing
    // a recursive call to readEntries(), get everything from indexedDB on the
    // first shot. Then (DirectoryReader has been used), return an empty
    // result array.
    if (!this.used) {
      this.dirEntry.filesystem.idb
        .getAllEntries(this.dirEntry.fullPath)
        .then(entries => {
          this.used = true;
          successCallback(entries);
        })
        .catch(err => {
          onError(err, errorCallback);
        });
    } else {
      successCallback([]);
    }
  }
}
