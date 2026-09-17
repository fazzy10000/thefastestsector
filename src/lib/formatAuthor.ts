/** Strip role suffixes like "Ellie Roddy | Motorsports Writer". */
export function displayAuthorName(name: string): string {
  return name.replace(/\s*\|\s*.*$/, '').trim() || name
}
