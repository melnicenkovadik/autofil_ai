import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

// Initialize English locale for country names
countries.registerLocale(enLocale);

/**
 * Normalize phone number to international format
 */
export function normalizePhoneNumber(phone: string, defaultCountry: CountryCode = 'US'): string {
  if (!phone) return phone;
  
  try {
    const parsed = parsePhoneNumber(phone, defaultCountry);
    if (parsed && parsed.isValid()) {
      return parsed.formatInternational();
    }
  } catch {
    // If parsing fails, return original
  }
  
  return phone;
}

/**
 * Get country ISO code from country name or code
 */
export function getCountryISO(input: string): string {
  if (!input) return input;
  
  const cleaned = input.trim();
  
  // Check if already a valid ISO code (2 or 3 letter)
  if (cleaned.length === 2) {
    const code = countries.getAlpha2Code(cleaned, 'en');
    if (code) return code;
  }
  
  if (cleaned.length === 3) {
    const alpha2 = countries.alpha3ToAlpha2(cleaned);
    if (alpha2) return alpha2;
  }
  
  // Try to find by name
  const code = countries.getAlpha2Code(cleaned, 'en');
  if (code) return code;
  
  // Return original if no match
  return cleaned;
}

/**
 * Get country name from ISO code
 */
export function getCountryName(code: string): string {
  if (!code) return code;
  
  const name = countries.getName(code, 'en');
  return name || code;
}

