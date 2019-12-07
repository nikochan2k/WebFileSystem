import {
  LocalFileSystem,
  FileSystemCallback,
  ErrorCallback,
  EntryCallback,
  Entry
} from "./filesystem";
import { INVALID_MODIFICATION_ERR, NOT_FOUND_ERR } from "./FileError";

const nativeFileSystem =
  window.requestFileSystem || window.webkitRequestFileSystem;

const nativeFileSystemSync =
  window.requestFileSystemSync || window.webkitRequestFileSystemSync;
