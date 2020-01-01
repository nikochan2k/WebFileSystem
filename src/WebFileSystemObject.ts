export interface WebFileSystemObject {
  isFile: boolean;
  name: string;
  fullPath: string;
  lastModified?: number;
  size?: number;
}
