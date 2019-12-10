import { ErrorCallback } from "../filesystem";
import { IdbObject } from "./IdbObject";

export function blobToFile(
  fileBits: BlobPart[],
  name: string,
  lastModified: number
) {
  const file = new File(fileBits, name, {
    lastModified: lastModified,
    type: "application/octet-stream"
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
  reader.readAsDataURL(blob);
  reader.onloadend = function() {
    onload(reader.result);
  };
}

export function onError(err: DOMError, errorCallback?: ErrorCallback) {
  if (errorCallback) {
    errorCallback(err);
  } else {
    console.error(err);
  }
}
