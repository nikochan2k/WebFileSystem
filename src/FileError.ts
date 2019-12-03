export interface FileError extends DOMError {
  code: number;
}

export const INVALID_MODIFICATION_ERR: FileError = {
  name: "INVALID_MODIFICATION_ERR",
  code: 9
};

export const NOT_FOUND_ERR: FileError = {
  name: "Not found",
  code: 1
};

export const NOT_IMPLEMENTED_ERR: FileError = {
  name: "Not implemented",
  code: 1
};
