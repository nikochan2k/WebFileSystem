import { AbstractFileWriter } from "../AbstractFileWriter";
import { FileWriter } from "../filewriter";
import { Idb } from "./Idb";
import { IdbFileEntry } from "./IdbFileEntry";
import { IdbObject } from "./IdbObject";
import { onError } from "../WebFileSystemUtil";

export class IdbFileWriter extends AbstractFileWriter implements FileWriter {
  constructor(private idbFileEntry: IdbFileEntry, public file: File) {
    super(idbFileEntry);
  }

  doWrite(file: File, onsuccess: () => void) {
    const entry: IdbObject = {
      isFile: this.fileEntry.isFile,
      isDirectory: this.fileEntry.isDirectory,
      name: this.fileEntry.name,
      fullPath: this.fileEntry.fullPath,
      lastModified: Date.now(),
      size: file.size
    };

    const writeToIdb = (
      entry: IdbObject,
      content: string | Blob,
      onsuccess: () => void
    ) => {
      this.idbFileEntry.filesystem.idb
        .put(entry, content)
        .then(() => {
          onsuccess();
          if (this.onwriteend) {
            const evt: ProgressEvent<EventTarget> = {
              loaded: this.position,
              total: this.length,
              lengthComputable: true
            } as any;
            this.onwriteend(evt);
          }
        })
        .catch(err => {
          this.handleError(err);
        });
    };

    if (Idb.SUPPORTS_BLOB) {
      writeToIdb(entry, file, onsuccess);
    } else {
      const reader = new FileReader();
      reader.onloadend = function() {
        const base64Url = reader.result as string;
        const base64 = base64Url.substr(base64Url.indexOf(",") + 1);
        writeToIdb(entry, base64, onsuccess);
      };
      reader.readAsDataURL(file);
    }
  }
}
