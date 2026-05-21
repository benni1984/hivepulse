'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { logout, clearTokens } from '@/lib/api';

const LOCALE_FLAGS: Record<string, string> = {
  en: '🇬🇧 EN',
  de: '🇩🇪 DE',
  fr: '🇫🇷 FR',
  es: '🇪🇸 ES',
};
const LOCALE_LABELS: Record<string, string> = {
  en: '🇬🇧 English',
  de: '🇩🇪 Deutsch',
  fr: '🇫🇷 Français',
  es: '🇪🇸 Español',
};

export default function Nav({ locale }: { locale: string }) {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);
  const [userDdOpen, setUserDdOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);
  const userDdRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';

  // Detect login state from localStorage (client-only)
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('access_token'));
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [isHome]);

  // Close language dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        setDdOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userDdRef.current && !userDdRef.current.contains(e.target as Node)) {
        setUserDdOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function switchLocale(next: string) {
    setDdOpen(false);
    router.replace(pathname, { locale: next });
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    setUserDdOpen(false);
    setMenuOpen(false);
    try {
      await logout();
    } catch {
      clearTokens();
    }
    setIsLoggedIn(false);
    // Redirect away from protected pages
    if (pathname.startsWith('/dashboard')) {
      router.replace('/');
    }
  }

  const navClass = ['site-nav', !isHome && 'page-nav', isHome && scrolled && 'scrolled']
    .filter(Boolean).join(' ');

  return (
    <nav className={navClass} id="site-nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">🐝 Api<span>Scan</span></Link>

        <button
          className="nav-toggle"
          aria-label="Open menu"
          onClick={() => setMenuOpen(o => !o)}
        >
          <span /><span /><span />
        </button>

        <ul className={`nav-links${menuOpen ? ' open' : ''}`} id="nav-links">
          <li><Link href="/map"        className={isActive('/map') ? 'active' : ''}        onClick={() => setMenuOpen(false)}>{t('map')}</Link></li>
          <li><Link href="/hornets"    className={isActive('/hornets') ? 'active' : ''}    onClick={() => setMenuOpen(false)}>{t('hornets')}</Link></li>
          <li><Link href="/news"       className={isActive('/news') ? 'active' : ''}       onClick={() => setMenuOpen(false)}>{t('news')}</Link></li>
          <li><Link href="/contribute" className={isActive('/contribute') ? 'active' : ''} onClick={() => setMenuOpen(false)}>{t('contribute')}</Link></li>
          <li><Link href="/members"    className={isActive('/members') ? 'active' : ''}    onClick={() => setMenuOpen(false)}>{t('members')}</Link></li>
          {isLoggedIn && (
            <li className="nav-mobile-account">
              <Link href="/dashboard" onClick={() => setMenuOpen(false)}>{t('dashboard')}</Link>
            </li>
          )}
          {isLoggedIn && (
            <li className="nav-mobile-account">
              <button className="nav-mobile-logout" onClick={handleLogout}>{t('logout')}</button>
            </li>
          )}
        </ul>

        <div className="nav-right">
          <div className="lang-switcher" ref={ddRef}>
            <button
              className="lang-current"
              aria-label="Switch language"
              onClick={() => setDdOpen(o => !o)}
            >
              <span className="lang-current-text">{LOCALE_FLAGS[locale] ?? LOCALE_FLAGS.en}</span>
              <i className="fas fa-chevron-down" />
            </button>
            {ddOpen && (
              <div className="lang-dropdown open">
                {routing.locales.map(l => (
                  <button key={l} className="lang-option" onClick={() => switchLocale(l)}>
                    {LOCALE_LABELS[l]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoggedIn ? (
            <div className="nav-user" ref={userDdRef}>
              <button
                className="nav-login nav-user-btn"
                aria-label="Account menu"
                onClick={() => setUserDdOpen(o => !o)}
              >
                <i className="fas fa-user-circle" />
                <span>{t('myAccount')}</span>
                <i className="fas fa-chevron-down nav-user-chevron" />
              </button>
              {userDdOpen && (
                <div className="nav-user-dropdown">
                  <Link href="/dashboard" className="nav-user-item" onClick={() => setUserDdOpen(false)}>
                    <i className="fas fa-th-large" />{t('dashboard')}
                  </Link>
                  <button className="nav-user-item nav-user-logout" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt" />{t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/dashboard" className="nav-login">{t('login')}</Link>
          )}

          <Link href="/#download" className="nav-cta">{t('download')}</Link>
        </div>
      </div>
    </nav>
  );
}
