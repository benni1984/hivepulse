import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'de', 'fr', 'es', 'pl'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});
