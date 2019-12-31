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

  writeToIdb(entry: IdbObject, content: string | Blob) {
    this.idbFileEntry.filesystem.idb
      .put(entry, content)
      .then(() => {
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
        onError(err);
        this.onerror(err);
      });
  }

  doWrite(data: Blob | ArrayBuffer) {
    let blob: Blob;
    if (data instanceof Blob) {
      blob = data;
    } else {
      blob = new Blob([data], {
        type: this.file.type
      });
    }

    const entry: IdbObject = {
      isFile: this.fileEntry.isFile,
      isDirectory: this.fileEntry.isDirectory,
      name: this.fileEntry.name,
      fullPath: this.fileEntry.fullPath,
      lastModified: Date.now(),
      size: blob.size
    };

    if (Idb.SUPPORTS_BLOB) {
      this.writeToIdb(entry, blob);
    } else {
      const reader = new FileReader();
      const that = this;
      reader.onloadend = function() {
        const base64Url = reader.result as string;
        const base64 = base64Url.substr(base64Url.indexOf(",") + 1);
        that.writeToIdb(entry, base64);
      };
      reader.readAsDataURL(blob);
    }
  }
}
