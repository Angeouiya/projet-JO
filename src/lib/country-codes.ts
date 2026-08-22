export const COUNTRY_CODES = [
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', example: '07 00 00 00 00' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', example: '70 00 00 00' },
  { code: 'ML', name: 'Mali', dial: '+223', example: '70 00 00 00' },
  { code: 'SN', name: 'Sénégal', dial: '+221', example: '77 000 00 00' },
  { code: 'GN', name: 'Guinée', dial: '+224', example: '620 00 00 00' },
  { code: 'TG', name: 'Togo', dial: '+228', example: '90 00 00 00' },
  { code: 'BJ', name: 'Bénin', dial: '+229', example: '01 00 00 00 00' },
  { code: 'NE', name: 'Niger', dial: '+227', example: '90 00 00 00' },
  { code: 'LR', name: 'Liberia', dial: '+231', example: '77 000 0000' },
  { code: 'SL', name: 'Sierra Leone', dial: '+232', example: '76 000000' },
  { code: 'GM', name: 'Gambie', dial: '+220', example: '300 0000' },
  { code: 'MR', name: 'Mauritanie', dial: '+222', example: '22 00 00 00' },
  { code: 'GH', name: 'Ghana', dial: '+233', example: '24 000 0000' },
  { code: 'CM', name: 'Cameroun', dial: '+237', example: '6 00 00 00 00' },
  { code: 'NG', name: 'Nigeria', dial: '+234', example: '80 0000 0000' },
  { code: 'MA', name: 'Maroc', dial: '+212', example: '6 00 00 00 00' },
  { code: 'DZ', name: 'Algérie', dial: '+213', example: '5 00 00 00 00' },
  { code: 'TN', name: 'Tunisie', dial: '+216', example: '20 000 000' },
  { code: 'FR', name: 'France', dial: '+33', example: '6 00 00 00 00' },
  { code: 'BE', name: 'Belgique', dial: '+32', example: '470 00 00 00' },
  { code: 'GB', name: 'Royaume-Uni', dial: '+44', example: '7700 900000' },
  { code: 'DE', name: 'Allemagne', dial: '+49', example: '151 00000000' },
  { code: 'IT', name: 'Italie', dial: '+39', example: '312 000 0000' },
  { code: 'ES', name: 'Espagne', dial: '+34', example: '600 000 000' },
  { code: 'CA', name: 'Canada', dial: '+1', example: '514 000 0000' },
  { code: 'US', name: 'États-Unis', dial: '+1', example: '202 000 0000' },
] as const;

export type CountryCodeOption = (typeof COUNTRY_CODES)[number];

export const DEFAULT_COUNTRY = COUNTRY_CODES[0];

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isPhone = (value: string) => /^\+?\d[\d\s().-]{7,}$/.test(value.trim());
export const countryValue = (country: CountryCodeOption) => `${country.code}:${country.dial}`;

export const getCountry = (value: string) => {
  const [code, dial] = value.split(':');
  return COUNTRY_CODES.find(country => country.code === code && country.dial === dial) || DEFAULT_COUNTRY;
};

export const getDialCode = (value: string) => getCountry(value).dial;

export function normalizePhone(value: string, dialCode: string): string {
  const phone = value.trim();
  if (!phone) return '';
  if (phone.startsWith('+')) return phone;
  return `${dialCode} ${phone}`;
}

export function countryValueFromPhone(phone?: string): string {
  const normalized = phone?.trim() || '';
  if (!normalized.startsWith('+')) return countryValue(DEFAULT_COUNTRY);

  const matchingCountry = [...COUNTRY_CODES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find(country => normalized.startsWith(country.dial));

  return countryValue(matchingCountry || DEFAULT_COUNTRY);
}

export function localPhoneFromStored(phone?: string, selectedCountryValue?: string): string {
  const normalized = phone?.trim() || '';
  if (!normalized) return '';

  const country = getCountry(selectedCountryValue || countryValueFromPhone(normalized));
  if (normalized.startsWith(country.dial)) {
    return normalized.slice(country.dial.length).trim();
  }

  return normalized;
}
