import { FileSystem, DirectoryEntry } from "../filesystem";

export class S3FileSystem implements FileSystem {
  name: string;
  root: DirectoryEntry;
}
