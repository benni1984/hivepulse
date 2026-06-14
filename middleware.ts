import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match root
    '/',
    // Match all pathnames except: _next internals, _vercel, and any path
    // with a file extension (static assets like .png, .css, .js, etc.)
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
};
