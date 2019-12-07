import { FileWriter } from "../filewriter";
import { IDB_SUPPORTS_BLOB } from "./IdbLocalFileSystem";
import { IdbFileEntry } from "./IdbFileEntry";
import { IdbObject } from "./IdbObject";
import { blobToBase64 as toBase64 } from "./IdbUtil";

export class IdbFileWriter implements FileWriter {
  private blob: Blob;
  private fileEntry: IdbFileEntry;

  constructor(fileEntry: IdbFileEntry) {
    this.fileEntry = fileEntry;
    this.position = 0;
    this.blob = fileEntry.blob;
  }

  position: number;

  get length() {
    return this.blob.size;
  }

  write(data: Blob): void {
    // TODO: not handling onwritestart, onprogress, onwrite, onabort. Throw an error if
    // they're defined.

    if (this.blob) {
      // Calc the head and tail fragments
      var head = this.blob.slice(0, this.position);
      var tail = this.blob.slice(this.position + data.size);

      // Calc the padding
      var padding = this.position - head.size;
      if (padding < 0) {
        padding = 0;
      }

      // Do the "write". In fact, a full overwrite of the Blob.
      // TODO: figure out if data.type should overwrite the exist blob's type.
      this.blob = new Blob([head, new Uint8Array(padding), data, tail], {
        type: this.blob.type
      });
    } else {
      this.blob = new Blob([data], { type: data.type });
    }

    const writeFile = (result: string | Blob | ArrayBuffer) => {
      if (result instanceof ArrayBuffer) {
        result = new Blob([result as ArrayBuffer], { type: this.blob.type });
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

          /*
          if (this.onwriteend) {
            this.onwriteend();
          }
          */
        })
        .catch(err => {
          this.onabort(err);
        });
    };

    if (IDB_SUPPORTS_BLOB) {
      writeFile(this.blob);
    } else {
      toBase64(this.blob, writeFile);
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
    if (this.blob) {
      if (size < this.length) {
        this.blob = this.blob.slice(0, size);
      } else {
        this.blob = new Blob([this.blob, new Uint8Array(size - this.length)], {
          type: this.blob.type
        });
      }
    } else {
      this.blob = new Blob([]);
    }

    this.position = 0; // truncate from beginning of file.

    this.write(this.blob); // calls onwritestart and onwriteend.
  }

  abort(): void {
    throw new Error("Method not implemented.");
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
    throw new Error("Method not implemented.");
  }

  dispatchEvent(event: Event): boolean {
    throw new Error("Method not implemented.");
  }

  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    throw new Error("Method not implemented.");
  }
}
