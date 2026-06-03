import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HiveStatsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">What are hive stats?</h2>
        <p>
          Hive stats turn your inspection history into charts and summary numbers, making it easy to
          spot trends you'd miss when reviewing individual records. Stats are available on the hive
          detail screen across all platforms.
        </p>
        <Screenshot caption="Hive stats page showing the varroa trend chart and mood distribution" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Time range filter</h2>
        <p>
          All charts and numbers can be filtered by time range: <strong>30 days</strong>, <strong>90 days</strong>,
          <strong>365 days</strong>, or <strong>All time</strong>. Use shorter ranges to focus on a current
          season; use All time to see the full history of a colony.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Each stat explained</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-chart-line" style={{ marginRight: 6, color: '#f59e0b' }} />Varroa Count Trend</div>
            <div className="help-stat-card-desc">
              A line chart of your varroa counts over time. The x-axis is inspection date; the y-axis
              is mites per 100 bees. Look for the slope: a rising line means the mite load is growing
              and treatment may be needed soon.
            </div>
            <span className="help-stat-card-good">Target: flat line near 0–2</span>{' '}
            <span className="help-stat-card-warn">Rising trend = treat urgently</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-face-smile" style={{ marginRight: 6, color: '#22c55e' }} />Mood Distribution</div>
            <div className="help-stat-card-desc">
              A doughnut chart showing the proportion of Calm, Nervous, and Aggressive inspections.
              Persistent nervousness or aggression can indicate queenlessness, disease, or genetic issues
              that warrant re-queening.
            </div>
            <span className="help-stat-card-good">Goal: &gt;80% Calm</span>{' '}
            <span className="help-stat-card-warn">&gt;20% Aggressive = investigate</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-crown" style={{ marginRight: 6, color: '#eab308' }} />Queen Seen Rate</div>
            <div className="help-stat-card-desc">
              Percentage of inspections where you visually confirmed the queen. A consistently low
              rate may mean the queen is hard to spot (normal for dark queens) or that the colony
              has become queenless.
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-egg" style={{ marginRight: 6, color: '#8b5cf6' }} />Brood Frames</div>
            <div className="help-stat-card-desc">
              Average number of brood frames recorded per inspection in the selected period.
              Tracks colony growth across the season — you expect a rise from spring, a peak in
              early summer, then a decline heading into autumn.
            </div>
            <span className="help-stat-card-good">Peak season: 6–9 frames</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-clock" style={{ marginRight: 6, color: '#64748b' }} />Swarm Cell Events</div>
            <div className="help-stat-card-desc">
              Count of inspections where swarm cells were reported. A high count indicates a swarmy
              colony that may benefit from swarm prevention management (splitting, providing more space).
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-calendar" style={{ marginRight: 6, color: '#0ea5e9' }} />Inspections per period</div>
            <div className="help-stat-card-desc">
              Total number of inspections logged in the selected time range. Consistent inspection
              frequency (every 7–14 days in peak season) gives the most reliable trend data.
            </div>
          </div>
        </div>

        <Screenshot caption="Varroa trend line chart with inspection dates on the x-axis" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Reading the varroa trend — what to do</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Flat line near 0–1</div>
            <div className="help-stat-card-desc">Mite load is under control. Continue regular monitoring every 3–4 weeks.</div>
            <span className="help-stat-card-good">No action needed</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Slowly rising (1–3)</div>
            <div className="help-stat-card-desc">Natural seasonal increase. Monitor more frequently (every 2 weeks) and plan treatment before it climbs higher.</div>
            <span className="help-stat-card-warn">Monitor closely</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Above 3 or steeply rising</div>
            <div className="help-stat-card-desc">Treatment threshold reached. Apply an approved varroa treatment immediately. Untreated colonies at this level typically collapse before winter.</div>
            <span className="help-stat-card-warn">Treat immediately</span>
          </div>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Thresholds vary by country, season, and method. Always follow your national beekeeping association's guidelines for treatment thresholds.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tips for better stats</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Stats improve dramatically with consistent data. Even recording just varroa count and mood on every visit gives you meaningful trend lines after four or five inspections.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Use the same sampling method every time. Switching between sugar roll and alcohol wash mid-season makes the trend line harder to interpret.</p>
        </div>
      </section>
    </>
  );
}
