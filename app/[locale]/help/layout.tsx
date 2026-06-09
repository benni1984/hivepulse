import '@/web/help.css';
import HelpSidebar from '@/components/HelpSidebar';

export default async function HelpLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="help-layout">
      <HelpSidebar locale={locale} />
      <main className="help-content">{children}</main>
    </div>
  );
}
