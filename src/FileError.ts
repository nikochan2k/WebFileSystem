export interface FileError extends DOMError {
  code: number;
}

export class InvalidStateError implements FileError {
  constructor(public filePath: string, public message?: string) {}
  name: "Invalid state error";
  code: 7;
}

export class InvalidModificationError implements FileError {
  constructor(public filePath: string, public message?: string) {}
  name: "Invalid modification error";
  code: 9;
}

export class NotFoundError implements FileError {
  constructor(public filePath: string, public message?: string) {}
  name: "Not found";
  code: 1;
}

export const NOT_IMPLEMENTED_ERR: FileError = {
  name: "Not implemented",
  code: -1
};
