import { DEFAULT_BLOB_PROPS } from "./IdbConstants";
import { FileWriter } from "../filewriter";
import { Idb } from "./Idb";
import { IdbFileEntry } from "./IdbFileEntry";
import { IdbObject } from "./IdbObject";
import { NOT_IMPLEMENTED_ERR } from "../FileError";
import { toBase64 } from "./IdbUtil";

export class IdbFileWriter implements FileWriter {
  constructor(private fileEntry: IdbFileEntry) {}

  position = 0;

  get length() {
    return this.fileEntry.blob.size;
  }

  write(data: Blob): void {
    // TODO: not handling onwritestart, onprogress, onwrite, onabort. Throw an error if
    // they're defined.

    if (this.fileEntry.blob) {
      // Calc the head and tail fragments
      const head = this.fileEntry.blob.slice(0, this.position);
      const tail = this.fileEntry.blob.slice(this.position + data.size);

      // Calc the padding
      let padding = this.position - head.size;
      if (padding < 0) {
        padding = 0;
      }

      // Do the "write". In fact, a full overwrite of the Blob.
      // TODO: figure out if data.type should overwrite the exist blob's type.
      this.fileEntry.blob = new Blob(
        [head, new Uint8Array(padding), data, tail],
        {
          type: this.fileEntry.blob.type
        }
      );
    } else {
      this.fileEntry.blob = new Blob([data], { type: data.type });
    }

    const writeFile = (result: string | Blob | ArrayBuffer) => {
      if (result instanceof ArrayBuffer) {
        result = new Blob([result as ArrayBuffer], {
          type: this.fileEntry.blob.type
        });
      }
      // Blob might be a DataURI depending on browser support.
      this.fileEntry.lastModifiedDate = new Date();
      const obj: IdbObject = {
        isFile: this.fileEntry.isFile,
        isDirectory: this.fileEntry.isDirectory,
        name: this.fileEntry.name,
        fullPath: this.fileEntry.fullPath,
        lastModified: this.fileEntry.lastModifiedDate.getTime(),
        content: result
      };
      const idb = this.fileEntry.filesystem.idb;
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
      writeFile(this.fileEntry.blob);
    } else {
      toBase64(this.fileEntry.blob, writeFile);
    }
  }

  seek(offset: number): void {
    this.position = offset;

    if (this.length < this.position) {
      this.position = this.length;
    } else if (this.position < 0) {
      this.position = 0;
    }
  }

  truncate(size: number): void {
    if (this.fileEntry.blob) {
      if (size < this.length) {
        this.fileEntry.blob = this.fileEntry.blob.slice(0, size);
      } else {
        this.fileEntry.blob = new Blob(
          [this.fileEntry.blob, new Uint8Array(size - this.length)],
          {
            type: this.fileEntry.blob.type
          }
        );
      }
    } else {
      this.fileEntry.blob = new Blob([], DEFAULT_BLOB_PROPS);
    }

    this.position = 0; // truncate from beginning of file.

    this.write(this.fileEntry.blob); // calls onwritestart and onwriteend.
  }

  abort(): void {
    throw NOT_IMPLEMENTED_ERR;
  }

  INIT: number;
  WRITING: number;
  DONE: number;
  readyState: number;
  error: Error;
  onwritestart: (event: ProgressEvent<EventTarget>) => void;
  onprogress: (event: ProgressEvent<EventTarget>) => void;
  onwrite: (event: ProgressEvent<EventTarget>) => void;
  onabort: (event: ProgressEvent<EventTarget>) => void;
  onerror: (event: ProgressEvent<EventTarget>) => void;
  onwriteend: (event: ProgressEvent<EventTarget>) => void;

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    throw NOT_IMPLEMENTED_ERR;
  }

  dispatchEvent(event: Event): boolean {
    throw NOT_IMPLEMENTED_ERR;
  }

  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    throw NOT_IMPLEMENTED_ERR;
  }
}
