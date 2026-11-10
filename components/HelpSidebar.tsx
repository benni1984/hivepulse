'use client';

// Both from @/i18n/navigation on purpose: Link adds the language to an href, and this
// usePathname strips it off again, so the hrefs and the active comparison speak the same
// locale-free paths. Mixing them with next/navigation's usePathname gave `/fr/fr/help` (#437).
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { HELP_TOPICS, HELP_GROUPS } from '@/lib/helpTopics';

export default function HelpSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations('helpIndex');

  return (
    <nav className="help-sidebar" aria-label="Help navigation">
      <Link
        href="/help"
        className={`help-sidebar-link${pathname === '/help' ? ' active' : ''}`}
        style={{ fontWeight: 700, marginBottom: 16 }}
      >
        <i className="fas fa-book icon" />
        {t('allTopics')}
      </Link>
      {HELP_GROUPS.map(group => {
        const topics = HELP_TOPICS.filter(tp => tp.group === group);
        if (!topics.length) return null;
        return (
          <div className="help-sidebar-group" key={group}>
            <div className="help-sidebar-title">{t(`groups.${group}`)}</div>
            {topics.map(topic => {
              const href = `/help/${topic.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={topic.slug}
                  href={href}
                  className={`help-sidebar-link${active ? ' active' : ''}`}
                >
                  <i className={`fas ${topic.icon} icon`} />
                  {t(`topics.${topic.slug}.title`)}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
