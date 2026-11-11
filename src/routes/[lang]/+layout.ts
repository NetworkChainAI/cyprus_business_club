import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { loadTranslations, locale } from '$lib/i18n';

export const load: LayoutLoad = async ({ params, url }) => {
  const lang = params.lang || 'en';

  // Strip lang prefix from pathname so route-based lazy loading in i18n.ts works
  const route = url.pathname.replace(/^\/[a-z]{2}(\/|$)/, '/') || '/';

  await loadTranslations(lang, route);
  if (browser) locale.set(lang);

  return { lang };
};
