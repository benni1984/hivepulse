import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTopicBySlug, HELP_TOPICS } from '@/lib/helpTopics';
import HelpScreenshot from '@/components/HelpScreenshot';

// ── Content imports ───────────────────────────────────────────
import GettingStartedContent from './content/getting-started';
import AviariesContent from './content/apiaries';
import HivesContent from './content/hives';
import QrCodesContent from './content/qr-codes';
import CustomFieldsContent from './content/custom-fields';
import InspectionsContent from './content/inspections';
import DataExportContent from './content/data-export';
import HiveStatsContent from './content/hive-stats';
import CommunityStatsContent from './content/community-stats';
import HornetTrackerContent from './content/hornet-tracker';
import HornetTrapsContent from './content/hornet-traps';
import RemindersContent from './content/reminders';
import AccountContent from './content/account';

const CONTENT_MAP: Record<string, React.ComponentType<{ Screenshot: typeof HelpScreenshot }>> = {
  'getting-started': GettingStartedContent,
  'apiaries': AviariesContent,
  'hives': HivesContent,
  'qr-codes': QrCodesContent,
  'custom-fields': CustomFieldsContent,
  'inspections': InspectionsContent,
  'data-export': DataExportContent,
  'hive-stats': HiveStatsContent,
  'community-stats': CommunityStatsContent,
  'hornet-tracker': HornetTrackerContent,
  'hornet-traps': HornetTrapsContent,
  'reminders': RemindersContent,
  'account': AccountContent,
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

  const Content = CONTENT_MAP[slug];
  if (!Content) notFound();

  return (
    <>
      {/* Breadcrumb */}
      <nav className="help-breadcrumb" aria-label="Breadcrumb">
        <Link href={`/${locale}/help`}>Help</Link>
        <i className="fas fa-chevron-right" style={{ fontSize: '.6rem' }} />
        <span>{topic.group}</span>
        <i className="fas fa-chevron-right" style={{ fontSize: '.6rem' }} />
        <span>{topic.title}</span>
      </nav>

      {/* Title */}
      <h1 className="help-page-title">{topic.title}</h1>
      <p className="help-page-lead">{topic.description}</p>

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
