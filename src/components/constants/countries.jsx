/**
 * Centralized country definitions
 */

export const COUNTRIES = [
  { code: "QA", name: "Qatar", currency: "QAR", flag: "🇶🇦", region: "Middle East" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", flag: "🇦🇪", region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", flag: "🇸🇦", region: "Middle East" },
  { code: "KW", name: "Kuwait", currency: "KWD", flag: "🇰🇼", region: "Middle East" },
  { code: "BH", name: "Bahrain", currency: "BHD", flag: "🇧🇭", region: "Middle East" },
  { code: "OM", name: "Oman", currency: "OMR", flag: "🇴🇲", region: "Middle East" },
  { code: "EG", name: "Egypt", currency: "EGP", flag: "🇪🇬", region: "Middle East" },
  { code: "JO", name: "Jordan", currency: "JOD", flag: "🇯🇴", region: "Middle East" },
  { code: "TR", name: "Turkey", currency: "TRY", flag: "🇹🇷", region: "Middle East" },
  { code: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧", region: "Europe" },
  { code: "US", name: "United States", currency: "USD", flag: "🇺🇸", region: "North America" },
  { code: "CA", name: "Canada", currency: "CAD", flag: "🇨🇦", region: "North America" },
  { code: "IN", name: "India", currency: "INR", flag: "🇮🇳", region: "Asia" },
  { code: "PK", name: "Pakistan", currency: "PKR", flag: "🇵🇰", region: "Asia" },
  { code: "OTHER", name: "Other", currency: "USD", flag: "🌍", region: "Other" },
];

export const getCountryInfo = (code) => {
  return COUNTRIES.find(c => c.code === code) || COUNTRIES.find(c => c.code === 'OTHER');
};

export const getCountriesByRegion = (region) => {
  return COUNTRIES.filter(c => c.region === region);
};