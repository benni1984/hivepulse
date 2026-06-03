'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HELP_TOPICS, HELP_GROUPS } from '@/lib/helpTopics';

export default function HelpSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();

  return (
    <nav className="help-sidebar" aria-label="Help navigation">
      <Link
        href={`/${locale}/help`}
        className={`help-sidebar-link${pathname === `/${locale}/help` ? ' active' : ''}`}
        style={{ fontWeight: 700, marginBottom: 16 }}
      >
        <i className="fas fa-book icon" />
        All topics
      </Link>
      {HELP_GROUPS.map(group => {
        const topics = HELP_TOPICS.filter(t => t.group === group);
        if (!topics.length) return null;
        return (
          <div className="help-sidebar-group" key={group}>
            <div className="help-sidebar-title">{group}</div>
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
                  {topic.title}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
