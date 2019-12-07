export interface IdbObject {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  lastModified?: number;
  content?: string | Blob;
}
