/** Ensure external links are absolute so "conztd.com" does not become /conztd.com */
export function normalizeExternalUrl(raw: string): string {
  const value = raw.trim()
  if (!value) return ''
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value
  if (value.startsWith('//')) return `https:${value}`
  return `https://${value}`
}
