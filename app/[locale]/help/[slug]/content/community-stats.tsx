import type HelpScreenshot from '@/components/HelpScreenshot';

export default function CommunityStatsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">What are community stats?</h2>
        <p>
          Community stats show platform-wide aggregate numbers calculated from all public apiaries
          on HivePulse. They let you compare your hive performance against beekeepers in the
          wider community without exposing anyone's individual data.
        </p>
        <p>
          The community stats screen is available under <strong>Members</strong> on all platforms.
          The four live stat cards are visible to everyone; the detailed breakdown is a
          <strong> Supporter feature</strong>.
        </p>
        <Screenshot caption="Members screen showing the four community stat cards" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">The four community stats explained</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Avg Varroa Count</div>
            <div className="help-stat-card-desc">
              The mean varroa count (mites per 100 bees) across all public inspections that
              recorded a varroa measurement. Gives you a regional benchmark: if your count is
              consistently higher than the community average, your colony may need treatment sooner
              than typical for your area.
            </div>
            <span className="help-stat-card-good">Community avg below 2 = healthy season</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Good Mood %</div>
            <div className="help-stat-card-desc">
              Percentage of inspections across all public apiaries rated as "Calm". A high
              community calm rate suggests good regional genetics and low stress conditions
              (good forage, low pest pressure). A falling good-mood trend can signal a difficult
              season for bees in your region.
            </div>
            <span className="help-stat-card-good">Above 75% = a calm season community-wide</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Avg Brood Frames</div>
            <div className="help-stat-card-desc">
              Mean number of brood frames recorded across all public inspections. In spring this
              number rises; in autumn it falls. Comparing your brood frame count against this
              average can reveal if your colonies are developing faster or slower than others
              in the community.
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Avg Inspection Interval</div>
            <div className="help-stat-card-desc">
              Mean number of days between consecutive inspections, averaged per hive across all
              public apiaries. Shorter intervals mean more attentive beekeepers — and more data
              for trend analysis. The community average gives you a sense of local inspection habits.
            </div>
            <span className="help-stat-card-good">7–14 days in active season</span>
          </div>
        </div>
        <Screenshot caption="The four stat cards with live community data" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Contributing to community stats</h2>
        <p>
          Your inspections contribute to community stats automatically when your apiary is set
          to <strong>public</strong>. No additional action is required. Individual records are
          never visible to other users — only aggregates (means, percentages) are published.
        </p>
        <p>
          To make an apiary public, open its detail page and toggle <em>Make public</em>.
          You can revert to private at any time.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Becoming a Supporter</h2>
        <p>
          The detailed community breakdown — trend charts, regional breakdowns, top-performing
          apiaries — is unlocked for HivePulse Supporters. Becoming a Supporter also helps keep
          the platform running and free for all beekeepers.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Supporter in-app purchase is coming soon. In the meantime, visit the <a href="/contribute">Contribute page</a> to learn how to support the project.</p>
        </div>
      </section>
    </>
  );
}
