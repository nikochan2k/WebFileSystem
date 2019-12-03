export interface FileError extends DOMError {
    code: number;
}
export declare const INVALID_MODIFICATION_ERR: FileError;
export declare const NOT_FOUND_ERR: FileError;
