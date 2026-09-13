/** ISO 3166-1 alpha-3 (motorsport-style) → regional-indicator flag emoji */
const ALPHA3_TO_FLAG: Record<string, string> = {
  ARE: '🇦🇪',
  AUS: '🇦🇺',
  AUT: '🇦🇹',
  AZE: '🇦🇿',
  BHR: '🇧🇭',
  BEL: '🇧🇪',
  BRA: '🇧🇷',
  CAN: '🇨🇦',
  CHN: '🇨🇳',
  DEU: '🇩🇪',
  ESP: '🇪🇸',
  GBR: '🇬🇧',
  HUN: '🇭🇺',
  IDN: '🇮🇩',
  ITA: '🇮🇹',
  JPN: '🇯🇵',
  MCO: '🇲🇨',
  MEX: '🇲🇽',
  NLD: '🇳🇱',
  QAT: '🇶🇦',
  SAU: '🇸🇦',
  SGP: '🇸🇬',
  MYS: '🇲🇾',
  OTH: '🏁',
  USA: '🇺🇸',
}

export function flagEmojiFromCountryCode(countryCode: string): string {
  const key = countryCode.toUpperCase()
  return ALPHA3_TO_FLAG[key] ?? '🏁'
}