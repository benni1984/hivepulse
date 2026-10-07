'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DashboardShell from '@/components/DashboardShell';
import BeekeepingYear from '@/components/BeekeepingYear';
import { useDashboardReady } from '@/hooks/useDashboardAuth';

/** The beekeeper's year: what to do when, as an endless timeline for the beekeeper's own place. */
export default function CalendarPage() {
  const t = useTranslations('dash');
  const ready = useDashboardReady();

  return (
    <DashboardShell>
      <Link href="/dashboard" className="dash-back">← {t('nav.apiaries')}</Link>
      <h1 className="dash-page-title">{t('calendar.title')}</h1>
      {ready && <BeekeepingYear />}
    </DashboardShell>
  );
}
