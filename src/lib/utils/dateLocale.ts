import { locale } from "$lib/i18n";

export function getDateLocale(): string {
  return locale.get() === 'ru' ? 'ru-RU' : 'en-US';
}

export function formatDate(dateValue: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(dateValue).toLocaleDateString(getDateLocale(), options);
}

export function formatTime(dateValue: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(dateValue).toLocaleTimeString(getDateLocale(), options);
}

export function formatDateTime(dateValue: string | Date, dateOpts?: Intl.DateTimeFormatOptions, timeOpts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(dateValue);
  const loc = getDateLocale();
  return `${d.toLocaleDateString(loc, dateOpts)} ${d.toLocaleTimeString(loc, timeOpts)}`;
}
