import { DEFAULT_BLOB_PROPS } from "./IdbConstants";
import { ErrorCallback } from "../filesystem";

export function toBlob(base64: string) {
  const buffer = new Uint8Array(base64.length);
  for (let i = 0; i < base64.length; i++) {
    buffer[i] = base64.charCodeAt(i);
  }
  const blob = new Blob([buffer.buffer], DEFAULT_BLOB_PROPS);
  return blob;
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
