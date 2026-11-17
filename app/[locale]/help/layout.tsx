import '@/web/help.css';
import HelpSidebar from '@/components/HelpSidebar';

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="help-layout">
      <HelpSidebar />
      <main className="help-content">{children}</main>
    </div>
  );
}
