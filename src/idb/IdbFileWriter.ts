import { AbstractFileWriter } from "../AbstractFileWriter";
import { FileWriter } from "../filewriter";
import { Idb } from "./Idb";
import { IdbFileEntry } from "./IdbFileEntry";
import { IdbObject } from "./IdbObject";
import { toBase64 } from "../WebFileSystemUtil";

export class IdbFileWriter extends AbstractFileWriter implements FileWriter {
  constructor(private idbFileEntry: IdbFileEntry) {
    super(idbFileEntry);
  }

  get file() {
    return this.idbFileEntry.file_;
  }

  set file(file: File) {
    this.idbFileEntry.file_ = file;
  }

  doWrite(data: Blob) {
    const writeFile = (result: string | Blob | ArrayBuffer) => {
      if (result instanceof ArrayBuffer) {
        result = new Blob([result as ArrayBuffer], {
          type: this.file.type
        });
      }
      // Blob might be a DataURI depending on browser support.
      const obj: IdbObject = {
        isFile: this.fileEntry.isFile,
        isDirectory: this.fileEntry.isDirectory,
        name: this.fileEntry.name,
        fullPath: this.fileEntry.fullPath,
        lastModified: Date.now(),
        content: result
      };
      const idb = this.idbFileEntry.filesystem.idb;
      idb
        .put(obj)
        .then(_ => {
          // Add size of data written to writer.position.
          this.position += data.size;

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
          this.onabort(err);
        });
    };

    if (Idb.SUPPORTS_BLOB) {
      writeFile(this.file);
    } else {
      toBase64(this.file, writeFile);
    }
  }
}
