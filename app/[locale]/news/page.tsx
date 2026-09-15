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
              <div className="news-date"><div className="day">15</div><div className="month">Sep 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Feature</span>
                <h3>A Guided Tour for New Users in Both Apps</h3>
                <p>The first time you sign in to the iOS or Android app, a short swipeable tour now introduces what HivePulse can do for you — QR codes on every hive, quick inspections, statistics, reminders and the hornet tracker. Skip it any time, and bring it back later from Settings with &quot;Show guided tour again&quot;.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="60">
              <div className="news-date"><div className="day">15</div><div className="month">Sep 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Feature</span>
                <h3>The iOS App Gets the New HivePulse Look and Catches Up with Web and Android</h3>
                <p>The iPhone app now uses the same amber-and-stone design and DM Sans typeface as the website. It also gained everything the Android app received recently: printable QR code PDFs that open right away, email reminders, the account-wide statistics overview, password reset links, managing your custom fields for all apiaries or just one, and — for supporters — the regional health map in the Members tab.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up">
              <div className="news-date"><div className="day">15</div><div className="month">Sep 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Fix</span>
                <h3>QR Code PDF Download Fixed in the Android App</h3>
                <p>Tapping Download PDF on a QR batch in the Android app did nothing — the download was handed off outside the app and failed silently once your session had been open for a while. The app now downloads the printable PDF itself, saves it to your Downloads folder and opens it right away — and tapping again no longer piles up duplicate copies.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="60">
              <div className="news-date"><div className="day">14</div><div className="month">Sep 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Feature</span>
                <h3>Statistics Overview and Community Health Map Come to Android</h3>
                <p>The Android app now has the same account-wide statistics page as the web dashboard — apiaries, hives and inspections at a glance, broken down per apiary for any time window. Supporters also get the regional health map in the Members tab, with the same varroa, mood, swarm and brood overlays as on the web.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="120">
              <div className="news-date"><div className="day">14</div><div className="month">Sep 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Feature</span>
                <h3>Custom Fields, Email Reminders and Password Resets Right in the Android App</h3>
                <p>A few things could previously only be done on the website. In the Android app you can now create, edit and delete your custom fields — for all apiaries or just one — turn on email reminders alongside push notifications, and request a password reset link without leaving the app.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="180">
              <div className="news-date"><div className="day">20</div><div className="month">Jul 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Fix</span>
                <h3>Dashboard Navigation Now Works on Mobile</h3>
                <p>The dashboard sidebar was hiding its entire navigation on small screens with nothing to replace it, leaving mobile visitors with no way to reach anything but a logout button. A new menu toggle now reveals your apiaries, stats, profile, and every other page from your phone.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="240">
              <div className="news-date"><div className="day">20</div><div className="month">Jul 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Feature</span>
                <h3>Inspection Reminders Now Also Available by Email</h3>
                <p>Push notifications only ever reached the iOS and Android apps, leaving web-only beekeepers with no way to be reminded of an overdue inspection. You can now opt in to email reminders from your profile page — independently of push, so you can enable either, both, or neither.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="300">
              <div className="news-date"><div className="day">16</div><div className="month">Jul 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Fix</span>
                <h3>Public Map Pins Fixed for Address-Only Apiaries</h3>
                <p>Public apiaries created through the web dashboard only ever collected a free-text address, never GPS coordinates — so they were counted in the community totals but never rendered as a pin on the live map. The backend now automatically resolves a saved address into coordinates, so every public apiary with an address shows up on the map going forward.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="360">
              <div className="news-date"><div className="day">03</div><div className="month">Jun 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Feature</span>
                <h3>Forgot Your Password? We&apos;ve Got You Covered</h3>
                <p>A full forgot-password / reset-password flow is now live across the web dashboard, iOS, and Android — request a reset link by email, set a new password, and all of your existing sessions are automatically signed out for safety.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="420">
              <div className="news-date"><div className="day">17</div><div className="month">May 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Feature</span>
                <h3>Custom Inspection Fields — Log What Matters to You</h3>
                <p>Every beekeeper tracks different things. Custom field definitions let you add your own inspection data points at the apiary or per-hive level, with support for text, number, boolean, date, and select-type fields — now available in the web dashboard, iOS, and Android.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="480">
              <div className="news-date"><div className="day">14</div><div className="month">May 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Release</span>
                <h3>Web Dashboard Launches — Manage Your Hives from Any Browser</h3>
                <p>You no longer need the mobile app to check in on your bees. The new browser dashboard covers login, your apiary list, hive detail with varroa charts, QR batch management, and personal statistics — all from a desktop or laptop.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="540">
              <div className="news-date"><div className="day">13</div><div className="month">May 2026</div></div>
              <div className="news-body">
                <span className="news-tag">Feature</span>
                <h3>Regional Varroa Heatmaps on the Public Map</h3>
                <p>The public live map now overlays a varroa-density heatmap — mite pressure aggregated across public apiaries in ~50 km grid cells, colour-coded green to red, so beekeepers can spot regional risk trends at a glance.</p>
              </div>
            </article>
            <article className="news-card" data-aos="fade-up" data-aos-delay="600">
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
