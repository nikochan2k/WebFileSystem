export function toBlob(bin: string) {
  const buffer = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) {
    buffer[i] = bin.charCodeAt(i);
  }
  const blob = new Blob([buffer.buffer], {
    type: "application/octet-stream"
  });
  return blob;
}

export function blobToBase64(
  blob: Blob,
  onload: (result: string | Blob | ArrayBuffer) => void
) {
  var reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = function() {
    onload(reader.result);
  };
}
