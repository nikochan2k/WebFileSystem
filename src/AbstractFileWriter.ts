import { blobToFile, createEmptyFile } from "./WebFileSystemUtil";
import { FileEntry } from "./filesystem";
import { FileWriter } from "./filewriter";
import { NOT_IMPLEMENTED_ERR } from "./FileError";

export abstract class AbstractFileWriter implements FileWriter {
  constructor(protected fileEntry: FileEntry) {}

  position = 0;
  abstract file: File;

  get length() {
    return this.file.size;
  }

  write(data: Blob): void {
    // TODO: not handling onwritestart, onprogress, onwrite, onabort. Throw an error if
    // they're defined.

    const current = this.file;
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
      this.file = blobToFile(
        [head, new Uint8Array(padding), data, tail],
        current.name,
        Date.now()
      );
      this.position += data.size;
    } else {
      this.file = blobToFile([data], this.fileEntry.name, Date.now());
      this.position = data.size;
    }

    this.doWrite(this.file);
  }

  protected abstract doWrite(data: Blob): void;

  seek(offset: number): void {
    this.position = offset;

    if (this.length < this.position) {
      this.position = this.length;
    } else if (this.position < 0) {
      this.position = 0;
    }
  }

  truncate(size: number): void {
    const current = this.file;
    if (current) {
      if (size < this.length) {
        this.file = blobToFile(
          [current.slice(0, size)],
          current.name,
          Date.now()
        );
      } else {
        this.file = blobToFile(
          [current, new Uint8Array(size - this.length)],
          current.name,
          Date.now()
        );
      }
    } else {
      this.file = createEmptyFile(this.fileEntry.name);
    }

    this.position = 0; // truncate from beginning of file.
    this.doWrite(this.file);
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
