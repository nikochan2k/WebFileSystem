import { DIR_SEPARATOR } from "../FileSystemConstants";

export function getPath(key: string) {
  let path = "";
  if (0 < key.length) {
    path = "/" + key;
  }
  return path;
}

export function getKey(fullPath: string) {
  let key = "";
  if (0 < fullPath.length) {
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
