export function countSlash(path: string) {
  let result = 0;
  for (let i = 0, end = path.length; i < end; i++) {
    if (path[i] === "/") {
      result++;
    }
  }
  return result;
}
