import { DIR_SEPARATOR } from "../WebFileSystemConstants";

export function getKey(fullPath: string) {
  let key: string = "";
  if (1 < fullPath.length) {
    key = fullPath.substr(1);
  }
  return key;
}

export function getPrefix(fullPath: string) {
  let key = getKey(fullPath);
  if (key) {
    key += DIR_SEPARATOR;
  }
  return key;
}
