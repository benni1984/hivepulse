import type HelpScreenshot from '@/components/HelpScreenshot';

export default function BeekeepingYearContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">What the timeline shows</h2>
        <p>
          The beekeeping year is a timeline of what a beekeeper does when, month by month: feeding with candy in
          February, the first inspections, swarm control every week and at the latest every 9 days, drone frames
          against varroa, when to move for which honey and when to extract it, and the preparation for winter with
          the varroa treatment and the feeding.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>It is endless: scroll up and down, the year repeats.</li>
          <li>It opens at today. What is going on now is marked <em>Now</em>, and a line shows where today falls.</li>
          <li>A task that repeats says how often, for example <em>Every 9 days at the latest</em> for swarm control.</li>
          <li>A task about one kind of honey shows it, for example rapeseed or acacia.</li>
        </ul>
        <p>
          You find it in the dashboard menu on the website (<em>Beekeeping year</em>) and in the toolbar of the apiary
          list in both apps (the calendar icon).
        </p>
        <Screenshot android="/docs/screenshots/android-beekeeping-year.png" web="/docs/screenshots/beekeeping-year.png" caption="The beekeeping year, opened at today" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Set your region</h2>
        <p>
          The dates are written for central Germany. Nature runs earlier in the south and later in the north, so you
          tell HivePulse where you keep your bees and the dates move: about four days per degree of latitude, so a
          colony near Hamburg flowers about two weeks later than one near Frankfurt.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Open the region</strong>
              <p>On the website: <em>Profile</em>, card <em>Region for the beekeeping year</em>. In the apps: <em>Settings &rarr; Region</em>, or <em>Set region</em> on the timeline.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Choose the country and enter the postal code</strong>
              <p>HivePulse looks the postal code up once and keeps only the position, not the address.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Adjust by hand if you like</strong>
              <p>A mountain valley is later, a sheltered garden earlier. Add or take away up to 28 days.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            Without a region the timeline uses the position of your first apiary, and without that the dates for
            central Germany. A line above the timeline says which, and how many days it moves the dates.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Honey: when to move, when to extract</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Rapeseed:</strong> move at the start of the bloom, extract at once when it ends (it sets hard within days).</li>
          <li><strong>Acacia:</strong> a bloom of about ten days, so move exactly then; the honey stays liquid for a long time.</li>
          <li><strong>Linden:</strong> from the end of June; extract when two thirds are capped and the water is 18 % or less.</li>
          <li><strong>Fir and spruce (honeydew):</strong> move only when the flow is confirmed; extract warm and in time, before it sets in the comb.</li>
          <li><strong>Sweet chestnut, lavender, sunflower:</strong> in the south and in warm summers; sunflower sets very fast.</li>
          <li><strong>Heather:</strong> from August; the honey is jelly-like and is pressed, not extracted.</li>
        </ul>
        <p>
          A honey is ripe when the combs are capped to about two thirds (shake test: nothing sprays out) and the water
          content is 18 % or less, measured with a refractometer.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Good to know</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>The dates are guide values from usual beekeeping practice, not rules: bloom and weather decide.</li>
          <li>Medicines only as approved and prescribed in your country; ask your beekeepers&rsquo; association or veterinary office when in doubt.</li>
          <li>Suspected foulbrood must be reported to the veterinary authority.</li>
          <li>The texts are in the language of the app: English, German, French, Spanish and Polish.</li>
        </ul>
      </section>
    </>
  );
}
