export function parse(string) {
  return JSON.parse(atob(string));
}

export function stringify(data) {
  return btoa(JSON.stringify(data));
}
