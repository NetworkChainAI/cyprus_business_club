import 'dotenv/config';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { verifyJwt } from '$lib/jwt';
import { getSecurityHeaders } from '$lib/server/security';

const supportedLanguages = ['en', 'ru'] as const;
const fallbackLanguage = 'en';

type Lang = (typeof supportedLanguages)[number];

function normalizeLang(value: string | null | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function isSupportedLang(v: string | undefined): v is Lang {
  return !!v && (supportedLanguages as readonly string[]).includes(v);
}

export const handle: Handle = async ({ event, resolve }) => {
  // --- Auth ---
  const token = event.cookies.get('auth_token');
  if (token) {
    try {
      const payload = await verifyJwt(token);
      if (payload) {
        event.locals.user = { id: payload.uid, email: payload.email };
        // payload.emailVerified === undefined means old token (existing user) — treat as verified
        event.locals.emailVerified = payload.emailVerified !== false;
      } else {
        event.locals.user = undefined;
        event.locals.emailVerified = false;
        event.cookies.delete('auth_token', { path: '/' });
      }
    } catch {
      event.locals.user = undefined;
      event.locals.emailVerified = false;
    }
  } else {
    event.locals.user = undefined;
    event.locals.emailVerified = false;
  }

  const { url, cookies, request } = event;
  const pathname = url.pathname;

  // --- Email verification guard ---
  // If user is logged in but email not verified, redirect to verify-email page
  // (skip for API routes, static assets, and the verify-email page itself)
  if (
    event.locals.user &&
    event.locals.emailVerified === false &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_app/') &&
    !pathname.includes('/verify-email') &&
    !pathname.includes('/login') &&
    !pathname.includes('/register')
  ) {
    const segments = pathname.split('/').filter(Boolean);
    const lang = (segments[0] === 'ru' ? 'ru' : 'en');
    throw redirect(302, `/${lang}/verify-email`);
  }

  // Skip lang logic for static/API routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_app/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/uploads/') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.txt') ||
    pathname.endsWith('.json')
  ) {
    const response = await resolve(event);
    for (const [key, value] of Object.entries(getSecurityHeaders())) {
      response.headers.set(key, value);
    }
    return response;
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  const isLangPrefixed = isSupportedLang(first);

  if (isLangPrefixed) {
    // URL already has a valid lang prefix — sync cookie and continue
    const urlLang = first;
    const cookieLang = normalizeLang(cookies.get('lang'));

    if (cookieLang !== urlLang) {
      cookies.set('lang', urlLang, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        httpOnly: false,
      });
    }

    event.locals.locale = urlLang;
    const response = await resolve(event);
    // Add security headers
    for (const [key, value] of Object.entries(getSecurityHeaders())) {
      response.headers.set(key, value);
    }
    return response;
  }

  // Detect language for redirect
  let lang = normalizeLang(cookies.get('lang'));

  if (!lang) {
    const accept = request.headers.get('accept-language');
    lang = normalizeLang(accept?.split(',')[0]?.split('-')[0]);
  }

  if (!isSupportedLang(lang)) lang = fallbackLanguage;

  cookies.set('lang', lang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    httpOnly: false,
  });

  throw redirect(302, `/${lang}${pathname === '/' ? '' : pathname}${url.search}`);
};
