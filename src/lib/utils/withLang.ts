import { get } from 'svelte/store';
import { page } from '$app/stores';

const SUPPORTED_LANGS = ['en', 'ru'] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

function isLang(seg: string | undefined): seg is Lang {
  return !!seg && (SUPPORTED_LANGS as readonly string[]).includes(seg);
}

/**
 * Prefix a path with the current lang from $page.params.lang.
 * Use in components/templates: href={withLang('/events')}
 */
export function withLang(path: string): string {
  if (path.startsWith('/api/')) return path;
  const current = get(page);
  const lang = isLang(current?.params?.lang) ? current.params.lang : 'en';
  return withLangSSR(lang, path);
}

/**
 * Prefix a path with a given lang.
 * Use in server-side load functions where $page is unavailable.
 */
export function withLangSSR(lang: string, path: string): string {
  if (path.startsWith('/api/')) return path;
  const safeLang = isLang(lang) ? lang : 'en';

  const [rawPath, suffix = ''] = path.split(/(?=[?#])/);
  const normalized = rawPath.startsWith('/') ? rawPath : '/' + rawPath;

  // Strip existing lang prefix if any
  const seg0 = normalized.split('/').filter(Boolean)[0];
  if (isLang(seg0)) return normalized + suffix;

  if (normalized === '/') return `/${safeLang}${suffix}`;
  return `/${safeLang}${normalized}${suffix}`;
}
