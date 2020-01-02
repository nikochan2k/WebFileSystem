export interface WebFileSystemObject {
  name: string;
  fullPath: string;
  lastModified: number;
  size: number;
  [key: string]: any;
}
