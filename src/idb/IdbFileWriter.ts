import { blobToFile, createEmptyFile, toBase64 } from "./IdbUtil";
import { FileWriter } from "../filewriter";
import { Idb } from "./Idb";
import { IdbFileEntry } from "./IdbFileEntry";
import { IdbObject } from "./IdbObject";
import { NOT_IMPLEMENTED_ERR } from "../FileError";

export class IdbFileWriter implements FileWriter {
  constructor(private fileEntry: IdbFileEntry) {}

  position = 0;

  get length() {
    return this.fileEntry.file_.size;
  }

  write(data: Blob): void {
    // TODO: not handling onwritestart, onprogress, onwrite, onabort. Throw an error if
    // they're defined.

    const current = this.fileEntry.file_;
    if (current) {
      // Calc the head and tail fragments
      const head = current.slice(0, this.position);
      const tail = current.slice(this.position + data.size);

      // Calc the padding
      let padding = this.position - head.size;
      if (padding < 0) {
        padding = 0;
      }

      // Do the "write". In fact, a full overwrite of the Blob.
      // TODO: figure out if data.type should overwrite the exist blob's type.
      this.fileEntry.file_ = blobToFile(
        [head, new Uint8Array(padding), data, tail],
        current.name,
        current.lastModified
      );
    } else {
      this.fileEntry.file_ = blobToFile(
        [data],
        this.fileEntry.name,
        Date.now()
      );
    }

    const writeFile = (result: string | Blob | ArrayBuffer) => {
      if (result instanceof ArrayBuffer) {
        result = new Blob([result as ArrayBuffer], {
          type: this.fileEntry.file_.type
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
      writeFile(this.fileEntry.file_);
    } else {
      toBase64(this.fileEntry.file_, writeFile);
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
    const current = this.fileEntry.file_;
    if (current) {
      if (size < this.length) {
        this.fileEntry.file_ = blobToFile(
          [current.slice(0, size)],
          current.name,
          Date.now()
        );
      } else {
        this.fileEntry.file_ = blobToFile(
          [current, new Uint8Array(size - this.length)],
          current.name,
          Date.now()
        );
      }
    } else {
      this.fileEntry.file_ = createEmptyFile(this.fileEntry.name);
    }

    this.position = 0; // truncate from beginning of file.

    this.write(this.fileEntry.file_); // calls onwritestart and onwriteend.
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
