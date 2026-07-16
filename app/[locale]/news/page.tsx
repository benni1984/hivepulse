import { useTranslations } from 'next-intl';

export default function NewsPage() {
  const t = useTranslations('news');
  return (
    <>
      <section className="page-hero news-page-hero">
        <div className="container">
          <div className="section-tag light" data-aos="fade-down">{t('tag')}</div>
          <h1 data-aos="fade-up" data-aos-delay="80">{t('title')}</h1>
          <p data-aos="fade-up" data-aos-delay="160">{t('sub')}</p>
        </div>
      </section>

      <section className="news-section">
        <div className="container">
          <div className="news-list">
            <article className="news-card" data-aos="fade-up">
              <div className="news-date"><div className="day">16</div><div className="month">Jul 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Fix</span>
                <h3>Public Map Pins Fixed for Address-Only Apiaries</h3>
                <p>Public apiaries created through the web dashboard only ever collected a free-text address, never GPS coordinates — so they were counted in the community totals but never rendered as a pin on the live map. The backend now automatically resolves a saved address into coordinates, so every public apiary with an address shows up on the map going forward.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="60">
              <div className="news-date"><div className="day">03</div><div className="month">Jun 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Feature</span>
                <h3>Forgot Your Password? We&apos;ve Got You Covered</h3>
                <p>A full forgot-password / reset-password flow is now live across the web dashboard, iOS, and Android — request a reset link by email, set a new password, and all of your existing sessions are automatically signed out for safety.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="120">
              <div className="news-date"><div className="day">17</div><div className="month">May 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Feature</span>
                <h3>Custom Inspection Fields — Log What Matters to You</h3>
                <p>Every beekeeper tracks different things. Custom field definitions let you add your own inspection data points at the apiary or per-hive level, with support for text, number, boolean, date, and select-type fields — now available in the web dashboard, iOS, and Android.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="180">
              <div className="news-date"><div className="day">14</div><div className="month">May 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Release</span>
                <h3>Web Dashboard Launches — Manage Your Hives from Any Browser</h3>
                <p>You no longer need the mobile app to check in on your bees. The new browser dashboard covers login, your apiary list, hive detail with varroa charts, QR batch management, and personal statistics — all from a desktop or laptop.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="240">
              <div className="news-date"><div className="day">13</div><div className="month">May 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Feature</span>
                <h3>Regional Varroa Heatmaps on the Public Map</h3>
                <p>The public live map now overlays a varroa-density heatmap — mite pressure aggregated across public apiaries in ~50 km grid cells, colour-coded green to red, so beekeepers can spot regional risk trends at a glance.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="300">
              <div className="news-date"><div className="day">12</div><div className="month">May 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Privacy</span>
                <h3>Apiary Locations Now Shown at City Level, Not Exact GPS</h3>
                <p>To protect beekeepers from potential hive theft, the public map and community pages now show the nearest city or village centroid instead of an apiary&apos;s exact coordinates. You still see your own exact location when logged in — only the public-facing view is fuzzed.</p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
