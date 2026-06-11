'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { HELP_TOPICS, HELP_GROUPS } from '@/lib/helpTopics';

export default function HelpSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations('helpIndex');

  return (
    <nav className="help-sidebar" aria-label="Help navigation">
      <Link
        href={`/${locale}/help`}
        className={`help-sidebar-link${pathname === `/${locale}/help` ? ' active' : ''}`}
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
              const href = `/${locale}/help/${topic.slug}`;
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
