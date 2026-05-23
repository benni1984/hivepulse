'use client';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/api';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const HivePulseLogo = () => (
  <svg width="36" height="36" viewBox="0 0 44 44" aria-hidden="true" style={{ flexShrink: 0 }}>
    <polygon points="22,2 39.12,12 39.12,32 22,42 4.88,32 4.88,12" fill="#f59e0b"/>
    <polygon points="22,4.5 37,13.5 37,30.5 22,39.5 7,30.5 7,13.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
    <polygon points="22,11 26.76,13.75 26.76,19.25 22,22 17.24,19.25 17.24,13.75" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
    <polygon points="17.24,19.25 22,22 22,27.5 17.24,30.25 12.48,27.5 12.48,22" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
    <polygon points="26.76,19.25 31.52,22 31.52,27.5 26.76,30.25 22,27.5 22,22" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M6,27 C12,27 15,24 20,25 C25,26 27,17 31,15 C34,14 36.5,13.5 36.5,13.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.9}/>
    <circle cx="6" cy="27" r="1.5" fill="white" opacity={0.55}/>
    <circle cx="36.5" cy="13.5" r="2.2" fill="white" opacity={0.95}/>
  </svg>
);

const I = {
  home:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  stats:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  users:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  qr:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  fields: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  user:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  shield: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  map:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  health: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
};

export default function DashboardShell({ children, adminOnly = false, memberOnly = false }: { children: React.ReactNode; adminOnly?: boolean; memberOnly?: boolean }) {
  const { user, loading } = useDashboardAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('dash');

  const isActive = (href: string) => {
    if (!pathname) return false;
    return href === '/dashboard' ? /\/dashboard$/.test(pathname) : pathname.includes(href);
  };

  async function handleLogout() {
    await logout();
    router.replace('/dashboard/login');
  }

  if (loading || !user) {
    return (
      <div className="dash-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (adminOnly && !user.is_admin) { router.replace('/dashboard'); return null; }
  if (memberOnly && !user.is_supporter && !user.is_admin) { router.replace('/dashboard'); return null; }

  const nav = (href: string, icon: React.ReactNode, label: string) => (
    <Link key={href} href={href} className={`dash-nav-link${isActive(href) ? ' active' : ''}`}>
      {icon}{label}
    </Link>
  );

  return (
    <div className="dash-overlay">
      <div className="dash-shell">
        <aside className="dash-sidebar">

          <Link href="/" className="dash-logo">
            <HivePulseLogo />
            <div>
              <div className="dash-logo-name">Hive<strong>Pulse</strong></div>
              <div className="dash-logo-tagline">Hive Inspection Platform</div>
            </div>
          </Link>

          <div className="dash-user">
            <div className="dash-user-avatar">{initials(user.name)}</div>
            <div className="dash-user-info">
              <div className="dash-user-name">{user.name}</div>
              <div className="dash-user-email">{user.email}</div>
            </div>
          </div>

          <nav className="dash-nav">
            {nav('/dashboard',                I.home,   t('nav.apiaries'))}
            {nav('/dashboard/stats',           I.stats,  t('nav.stats'))}
            {(user.is_supporter || user.is_admin) && nav('/dashboard/members', I.users, t('nav.members'))}
            {nav('/dashboard/qr-batches',      I.qr,     t('nav.qrBatches'))}
            {nav('/dashboard/field-definitions', I.fields, t('nav.customFields'))}
            {nav('/dashboard/profile',         I.user,   t('nav.profile'))}
            {user.is_admin && (
              <>
                <div className="dash-nav-section">{t('admin.nav.section')}</div>
                {nav('/dashboard/admin',        I.shield, t('admin.nav.stats'))}
                {nav('/dashboard/admin/users',  I.users,  t('admin.nav.users'))}
                {nav('/dashboard/admin/map',    I.map,    t('admin.nav.map'))}
                {nav('/dashboard/admin/health', I.health, t('admin.nav.health'))}
              </>
            )}
          </nav>

          <button className="dash-logout" onClick={handleLogout}>{t('nav.logout')}</button>
        </aside>
        <main className="dash-main"><div className="dash-main-inner">{children}</div></main>
      </div>
    </div>
  );
}
