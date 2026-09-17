/** ISO 3166-1 alpha-2 → alpha-3 (motorsport / flag emoji codes used by the site). */
const ALPHA2_TO_ALPHA3: Record<string, string> = {
  AE: 'ARE',
  AT: 'AUT',
  AU: 'AUS',
  AZ: 'AZE',
  BE: 'BEL',
  BH: 'BHR',
  BR: 'BRA',
  CA: 'CAN',
  CH: 'CHE',
  CN: 'CHN',
  DE: 'DEU',
  ES: 'ESP',
  FR: 'FRA',
  GB: 'GBR',
  HU: 'HUN',
  ID: 'IDN',
  IT: 'ITA',
  JP: 'JPN',
  KR: 'KOR',
  MC: 'MCO',
  MX: 'MEX',
  MY: 'MYS',
  NL: 'NLD',
  QA: 'QAT',
  SA: 'SAU',
  SG: 'SGP',
  US: 'USA',
}

const COUNTRY_NAME_TO_ALPHA3: Record<string, string> = {
  australia: 'AUS',
  austria: 'AUT',
  azerbaijan: 'AZE',
  bahrain: 'BHR',
  belgium: 'BEL',
  brazil: 'BRA',
  canada: 'CAN',
  china: 'CHN',
  germany: 'DEU',
  hungary: 'HUN',
  italy: 'ITA',
  japan: 'JPN',
  malaysia: 'MYS',
  mexico: 'MEX',
  monaco: 'MCO',
  netherlands: 'NLD',
  qatar: 'QAT',
  'saudi arabia': 'SAU',
  singapore: 'SGP',
  spain: 'ESP',
  'united arab emirates': 'ARE',
  'united kingdom': 'GBR',
  'united states': 'USA',
  usa: 'USA',
  uae: 'ARE',
}

const ALPHA3_TO_NAME: Record<string, string> = {
  ARE: 'United Arab Emirates',
  AUS: 'Australia',
  AUT: 'Austria',
  AZE: 'Azerbaijan',
  BEL: 'Belgium',
  BHR: 'Bahrain',
  BRA: 'Brazil',
  CAN: 'Canada',
  CHN: 'China',
  DEU: 'Germany',
  ESP: 'Spain',
  GBR: 'United Kingdom',
  HUN: 'Hungary',
  ITA: 'Italy',
  JPN: 'Japan',
  MCO: 'Monaco',
  MEX: 'Mexico',
  MYS: 'Malaysia',
  NLD: 'Netherlands',
  QAT: 'Qatar',
  SAU: 'Saudi Arabia',
  SGP: 'Singapore',
  USA: 'United States',
}

export function alpha2ToAlpha3(code: string): string {
  const key = code.trim().toUpperCase()
  if (key.length === 3) return key
  return ALPHA2_TO_ALPHA3[key] ?? 'OTH'
}

export function countryNameToAlpha3(name: string): string {
  const key = name.trim().toLowerCase()
  return COUNTRY_NAME_TO_ALPHA3[key] ?? 'OTH'
}

export function alpha3ToCountryName(code: string): string {
  return ALPHA3_TO_NAME[code.toUpperCase()] ?? code
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}
