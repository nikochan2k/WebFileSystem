export interface FileError extends DOMError {
  code: number;
}

export const INVALID_MODIFICATION_ERR: FileError = {
  name: "INVALID_MODIFICATION_ERR",
  code: 9
};

export const NOT_FOUND_ERR: FileError = {
  name: "NOT_FOUND_ERR",
  code: 1
};
