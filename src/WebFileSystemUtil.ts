import { DIR_SEPARATOR } from "./WebFileSystemConstants";
import {
  DirectoryEntry,
  Entry,
  ErrorCallback,
  FileEntry,
  FileSystemAsync
} from "./filesystem";
import { WebDirectoryEntryAsync } from "./WebDirectoryEntryAsync";
import { WebFileEntryAsync } from "./WebFileEntryAsync";

export function createEntry(fileSystemAsync: FileSystemAsync, entry: Entry) {
  return entry.isFile
    ? new WebFileEntryAsync(fileSystemAsync, entry as FileEntry)
    : new WebDirectoryEntryAsync(fileSystemAsync, entry as DirectoryEntry);
}

export function resolveToFullPath(cwdFullPath: string, path: string) {
  let fullPath = path;

  const relativePath = path[0] != DIR_SEPARATOR;
  if (relativePath) {
    fullPath = cwdFullPath + DIR_SEPARATOR + path;
  }

  // Normalize '.'s,  '..'s and '//'s.
  const parts = fullPath.split(DIR_SEPARATOR);
  const finalParts = [];
  for (const part of parts) {
    if (part === "..") {
      // Go up one level.
      if (!finalParts.length) {
        throw Error("Invalid path");
      }
      finalParts.pop();
    } else if (part === ".") {
      // Skip over the current directory.
    } else if (part !== "") {
      // Eliminate sequences of '/'s as well as possible leading/trailing '/'s.
      finalParts.push(part);
    }
  }

  fullPath = DIR_SEPARATOR + finalParts.join(DIR_SEPARATOR);

  // fullPath is guaranteed to be normalized by construction at this point:
  // '.'s, '..'s, '//'s will never appear in it.
  return fullPath;
}

export function blobToFile(
  fileBits: BlobPart[],
  name: string,
  lastModified: number,
  type?: string
) {
  const file = new File(fileBits, name, {
    lastModified: lastModified,
    type: type || "application/octet-stream"
  });
  return file;
}

export function base64ToFile(
  base64: string,
  name: string,
  lastModified: number
) {
  const array = new Uint8Array(base64.length);
  for (let i = 0; i < base64.length; i++) {
    array[i] = base64.charCodeAt(i);
  }
  const file = new File([array.buffer], name, {
    lastModified: lastModified,
    type: "application/octet-stream"
  });
  return file;
}

export function createEmptyFile(name: string) {
  return new File([], name, {
    lastModified: Date.now(),
    type: "application/octet-stream"
  });
}

export function toBase64(
  blob: Blob,
  onload: (result: string | Blob | ArrayBuffer) => void
) {
  const reader = new FileReader();
  reader.onloadend = function() {
    onload(reader.result);
  };
  reader.readAsDataURL(blob);
}

export function toArrayBuffer(
  blob: Blob,
  onload: (result: ArrayBuffer) => void
) {
  const reader = new FileReader();
  reader.onloadend = function() {
    onload(reader.result as ArrayBuffer);
  };
  reader.readAsArrayBuffer(blob);
}

export function onError(err: DOMError, errorCallback?: ErrorCallback) {
  if (errorCallback) {
    errorCallback(err);
  } else {
    console.error(err);
  }
}
