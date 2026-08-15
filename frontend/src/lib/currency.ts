import i18n from '../i18n';

const CURRENCY_CODES = ['UZS', 'USD', 'EUR', 'RUB', 'KZT'] as const;

export function getCurrencyOptions() {
  return CURRENCY_CODES.map((code) => ({ value: code, label: `${code} — ${i18n.t(`currencyNames.${code}`)}` }));
}
