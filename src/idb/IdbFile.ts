export class IdbFile implements File {
  constructor(
    private blob: Blob,
    public name: string,
    public lastModifiedDate: Date
  ) {}

  get size() {
    return this.blob.size;
  }

  get lastModified() {
    return this.lastModifiedDate.getTime();
  }

  get type() {
    return this.blob.type;
  }

  slice(
    start?: number | undefined,
    end?: number | undefined,
    contentType?: string | undefined
  ): Blob {
    if (this.blob == null) {
      return null;
    }
    return this.blob.slice(start, end, contentType);
  }
}
