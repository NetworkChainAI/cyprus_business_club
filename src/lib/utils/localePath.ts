import { get } from 'svelte/store';
import { page } from '$app/stores';

const SUPPORTED_LOCALES = ['en', 'ru'];
const DEFAULT_LOCALE = 'en';

/** Strip /en or /ru prefix from a pathname. */
export function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  if (match && SUPPORTED_LOCALES.includes(match[1])) {
    return match[2] || '/';
  }
  return pathname;
}

/** Get the locale from a URL pathname. Falls back to DEFAULT_LOCALE. */
export function getLocaleFromPath(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (match && SUPPORTED_LOCALES.includes(match[1])) {
    return match[1];
  }
  return DEFAULT_LOCALE;
}

/** Prepend a specific locale prefix to a path. */
export function localePathWith(locale: string, path: string): string {
  if (path.startsWith('/api/')) return path;
  const stripped = stripLocalePrefix(path);
  return `/${locale}${stripped === '/' ? '' : stripped}` || `/${locale}`;
}

/**
 * Prepend current locale prefix to a path.
 * Reads locale from $page.url.pathname. Use only in browser/component context.
 */
export function localePath(path: string): string {
  if (path.startsWith('/api/')) return path;
  const currentPath = get(page).url.pathname;
  const locale = getLocaleFromPath(currentPath);
  return localePathWith(locale, path);
}

/** Server-side: get locale-prefixed path using the request URL. */
export function serverLocalePath(url: URL, path: string): string {
  const locale = getLocaleFromPath(url.pathname);
  return localePathWith(locale, path);
}
