import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getTopicBySlug, HELP_TOPICS } from '@/lib/helpTopics';
import HelpScreenshot from '@/components/HelpScreenshot';

// ── Content imports (English) ───────────────────────────────────
import GettingStartedEn from './content/getting-started';
import AviariesEn from './content/apiaries';
import HivesEn from './content/hives';
import QrCodesEn from './content/qr-codes';
import CustomFieldsEn from './content/custom-fields';
import InspectionsEn from './content/inspections';
import DataExportEn from './content/data-export';
import HiveStatsEn from './content/hive-stats';
import CommunityStatsEn from './content/community-stats';
import HornetTrackerEn from './content/hornet-tracker';
import HornetTrapsEn from './content/hornet-traps';
import RemindersEn from './content/reminders';
import AccountEn from './content/account';

// ── Content imports (German) ────────────────────────────────────
import GettingStartedDe from './content/getting-started.de';
import AviariesDe from './content/apiaries.de';
import HivesDe from './content/hives.de';
import QrCodesDe from './content/qr-codes.de';
import CustomFieldsDe from './content/custom-fields.de';
import InspectionsDe from './content/inspections.de';
import DataExportDe from './content/data-export.de';
import HiveStatsDe from './content/hive-stats.de';
import CommunityStatsDe from './content/community-stats.de';
import HornetTrackerDe from './content/hornet-tracker.de';
import HornetTrapsDe from './content/hornet-traps.de';
import RemindersDe from './content/reminders.de';
import AccountDe from './content/account.de';

// ── Content imports (French) ────────────────────────────────────
import GettingStartedFr from './content/getting-started.fr';
import AviariesFr from './content/apiaries.fr';
import HivesFr from './content/hives.fr';
import QrCodesFr from './content/qr-codes.fr';
import CustomFieldsFr from './content/custom-fields.fr';
import InspectionsFr from './content/inspections.fr';
import DataExportFr from './content/data-export.fr';
import HiveStatsFr from './content/hive-stats.fr';
import CommunityStatsFr from './content/community-stats.fr';
import HornetTrackerFr from './content/hornet-tracker.fr';
import HornetTrapsFr from './content/hornet-traps.fr';
import RemindersFr from './content/reminders.fr';
import AccountFr from './content/account.fr';

// ── Content imports (Spanish) ───────────────────────────────────
import GettingStartedEs from './content/getting-started.es';
import AviariesEs from './content/apiaries.es';
import HivesEs from './content/hives.es';
import QrCodesEs from './content/qr-codes.es';
import CustomFieldsEs from './content/custom-fields.es';
import InspectionsEs from './content/inspections.es';
import DataExportEs from './content/data-export.es';
import HiveStatsEs from './content/hive-stats.es';
import CommunityStatsEs from './content/community-stats.es';
import HornetTrackerEs from './content/hornet-tracker.es';
import HornetTrapsEs from './content/hornet-traps.es';
import RemindersEs from './content/reminders.es';
import AccountEs from './content/account.es';

type ContentComponent = React.ComponentType<{ Screenshot: typeof HelpScreenshot }>;
type SlugMap = Record<string, ContentComponent>;

const CONTENT: Record<string, SlugMap> = {
  en: {
    'getting-started': GettingStartedEn, 'apiaries': AviariesEn, 'hives': HivesEn,
    'qr-codes': QrCodesEn, 'custom-fields': CustomFieldsEn, 'inspections': InspectionsEn,
    'data-export': DataExportEn, 'hive-stats': HiveStatsEn, 'community-stats': CommunityStatsEn,
    'hornet-tracker': HornetTrackerEn, 'hornet-traps': HornetTrapsEn,
    'reminders': RemindersEn, 'account': AccountEn,
  },
  de: {
    'getting-started': GettingStartedDe, 'apiaries': AviariesDe, 'hives': HivesDe,
    'qr-codes': QrCodesDe, 'custom-fields': CustomFieldsDe, 'inspections': InspectionsDe,
    'data-export': DataExportDe, 'hive-stats': HiveStatsDe, 'community-stats': CommunityStatsDe,
    'hornet-tracker': HornetTrackerDe, 'hornet-traps': HornetTrapsDe,
    'reminders': RemindersDe, 'account': AccountDe,
  },
  fr: {
    'getting-started': GettingStartedFr, 'apiaries': AviariesFr, 'hives': HivesFr,
    'qr-codes': QrCodesFr, 'custom-fields': CustomFieldsFr, 'inspections': InspectionsFr,
    'data-export': DataExportFr, 'hive-stats': HiveStatsFr, 'community-stats': CommunityStatsFr,
    'hornet-tracker': HornetTrackerFr, 'hornet-traps': HornetTrapsFr,
    'reminders': RemindersFr, 'account': AccountFr,
  },
  es: {
    'getting-started': GettingStartedEs, 'apiaries': AviariesEs, 'hives': HivesEs,
    'qr-codes': QrCodesEs, 'custom-fields': CustomFieldsEs, 'inspections': InspectionsEs,
    'data-export': DataExportEs, 'hive-stats': HiveStatsEs, 'community-stats': CommunityStatsEs,
    'hornet-tracker': HornetTrackerEs, 'hornet-traps': HornetTrapsEs,
    'reminders': RemindersEs, 'account': AccountEs,
  },
};

export async function generateStaticParams() {
  return HELP_TOPICS.map(t => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return {};
  return {
    title: `${topic.title} — HivePulse Help`,
    description: topic.description,
  };
}

export default async function HelpTopicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  const localeMap = CONTENT[locale] ?? CONTENT.en;
  const Content = localeMap[slug] ?? CONTENT.en[slug];
  if (!Content) notFound();

  const t = await getTranslations({ locale, namespace: 'helpIndex' });
  const title = t(`topics.${slug}.title`);
  const description = t(`topics.${slug}.desc`);

  return (
    <>
      {/* Breadcrumb */}
      <nav className="help-breadcrumb" aria-label="Breadcrumb">
        <Link href={`/${locale}/help`}>{t('allTopics')}</Link>
        <i className="fas fa-chevron-right" style={{ fontSize: '.6rem' }} />
        <span>{t(`groups.${topic.group}`)}</span>
        <i className="fas fa-chevron-right" style={{ fontSize: '.6rem' }} />
        <span>{title}</span>
      </nav>

      {/* Title */}
      <h1 className="help-page-title">
        <i className={`fas ${topic.icon}`} style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
        {title}
      </h1>
      <p className="help-page-lead">{description}</p>

      {/* Platform badges */}
      <div className="help-platforms">
        {topic.platforms.includes('web') && (
          <span className="help-platform-badge web"><i className="fas fa-globe" /> Web</span>
        )}
        {topic.platforms.includes('ios') && (
          <span className="help-platform-badge ios"><i className="fab fa-apple" /> iOS</span>
        )}
        {topic.platforms.includes('android') && (
          <span className="help-platform-badge android"><i className="fab fa-android" /> Android</span>
        )}
      </div>

      {/* Page content */}
      <Content Screenshot={HelpScreenshot} />
    </>
  );
}
