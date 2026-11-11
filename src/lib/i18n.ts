import i18n from 'sveltekit-i18n';
import type { Config } from 'sveltekit-i18n';

const config: Config = {
  fallbackLocale: 'en',
  initLocale: 'en',
  loaders: [
    // --- COMMON (all routes) ---
    { locale: 'en', key: 'common', loader: async () => (await import('./translations/en/common.json')).default },
    { locale: 'ru', key: 'common', loader: async () => (await import('./translations/ru/common.json')).default },
    // --- HOME ---
    { locale: 'en', key: 'home', routes: ['/', '/technologies'], loader: async () => (await import('./translations/en/home.json')).default },
    { locale: 'ru', key: 'home', routes: ['/', '/technologies'], loader: async () => (await import('./translations/ru/home.json')).default },
    // --- AUTH ---
    { locale: 'en', key: 'auth', routes: ['/login', '/register'], loader: async () => (await import('./translations/en/auth.json')).default },
    { locale: 'ru', key: 'auth', routes: ['/login', '/register'], loader: async () => (await import('./translations/ru/auth.json')).default },
    // --- EVENTS ---
    { locale: 'en', key: 'events', routes: ['/', /^\/events/, /^\/communities/], loader: async () => (await import('./translations/en/events.json')).default },
    { locale: 'ru', key: 'events', routes: ['/', /^\/events/, /^\/communities/], loader: async () => (await import('./translations/ru/events.json')).default },
    // --- MEMBERS ---
    { locale: 'en', key: 'members', routes: [/^\/members/], loader: async () => (await import('./translations/en/members.json')).default },
    { locale: 'ru', key: 'members', routes: [/^\/members/], loader: async () => (await import('./translations/ru/members.json')).default },
    // --- PARTNERS ---
    { locale: 'en', key: 'partners', routes: [/^\/partners/, /^\/admin\/.*brand/, /^\/brand/], loader: async () => (await import('./translations/en/partners.json')).default },
    { locale: 'ru', key: 'partners', routes: [/^\/partners/, /^\/admin\/.*brand/, /^\/brand/], loader: async () => (await import('./translations/ru/partners.json')).default },
    // --- COMMUNITIES ---
    { locale: 'en', key: 'communities', routes: [/^\/communities/, /^\/admin\/.*communit/], loader: async () => (await import('./translations/en/communities.json')).default },
    { locale: 'ru', key: 'communities', routes: [/^\/communities/, /^\/admin\/.*communit/], loader: async () => (await import('./translations/ru/communities.json')).default },
    // --- PROFILE ---
    { locale: 'en', key: 'profile', routes: [/^\/profile/], loader: async () => (await import('./translations/en/profile.json')).default },
    { locale: 'ru', key: 'profile', routes: [/^\/profile/], loader: async () => (await import('./translations/ru/profile.json')).default },
    // --- CHAT ---
    { locale: 'en', key: 'chat', routes: [/^\/chat/], loader: async () => (await import('./translations/en/chat.json')).default },
    { locale: 'ru', key: 'chat', routes: [/^\/chat/], loader: async () => (await import('./translations/ru/chat.json')).default },
    // --- WALLET ---
    { locale: 'en', key: 'wallet', routes: ['/wallet'], loader: async () => (await import('./translations/en/wallet.json')).default },
    { locale: 'ru', key: 'wallet', routes: ['/wallet'], loader: async () => (await import('./translations/ru/wallet.json')).default },
    // --- CALENDAR ---
    { locale: 'en', key: 'calendar', routes: ['/calendar'], loader: async () => (await import('./translations/en/calendar.json')).default },
    { locale: 'ru', key: 'calendar', routes: ['/calendar'], loader: async () => (await import('./translations/ru/calendar.json')).default },
    // --- NOTIFICATIONS ---
    { locale: 'en', key: 'notifications', loader: async () => (await import('./translations/en/notifications.json')).default },
    { locale: 'ru', key: 'notifications', loader: async () => (await import('./translations/ru/notifications.json')).default },
    // --- ADMIN ---
    { locale: 'en', key: 'admin', routes: [/^\/admin/, /^\/platform-admin/, /^\/events/, /^\/members/, /^\/profile/], loader: async () => (await import('./translations/en/admin.json')).default },
    { locale: 'ru', key: 'admin', routes: [/^\/admin/, /^\/platform-admin/, /^\/events/, /^\/members/, /^\/profile/], loader: async () => (await import('./translations/ru/admin.json')).default },
    // --- REPUTATION ---
    { locale: 'en', key: 'reputation', routes: ['/reputation'], loader: async () => (await import('./translations/en/reputation.json')).default },
    { locale: 'ru', key: 'reputation', routes: ['/reputation'], loader: async () => (await import('./translations/ru/reputation.json')).default },
    // --- ONBOARDING ---
    { locale: 'en', key: 'onboarding', routes: [/^\/onboarding/], loader: async () => (await import('./translations/en/onboarding.json')).default },
    { locale: 'ru', key: 'onboarding', routes: [/^\/onboarding/], loader: async () => (await import('./translations/ru/onboarding.json')).default },
  ],
};

export const { t, locale, locales, loading, loadTranslations, translations, setLocale, setRoute } = new i18n(config);
