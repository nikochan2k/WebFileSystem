import { DIR_SEPARATOR } from "../WebFileSystemConstants";

export function getKey(fullPath: string) {
  let key: string = "";
  if (1 < fullPath.length) {
    key = fullPath.substr(1);
  }
  return key;
}

export function getPrefix(fullPath: string) {
  const key = getKey(fullPath);
  return key + DIR_SEPARATOR;
}
