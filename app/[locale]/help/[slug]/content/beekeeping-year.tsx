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
        <h2 className="help-section-title">Two ways of looking at it</h2>
        <p>
          On the website the year has a second view. <em>List</em> is the one described above: what to do now,
          month by month, with the whole text of every entry. <em>Overview</em> is the same year as one picture —
          the twelve months across the screen, a row per subject and a bar per job, so you can see how the year
          hangs together: that swarm control runs straight through the first honey, that the varroa treatment sits
          in the gap after the supers come off.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Most jobs carry a photograph of the thing itself: the plant in flower, a capped queen cell, the mite
            on a bee. Point at a bar to see it, with the dates and the full name of the job.</li>
          <li>Jobs that happen at the same time stand under each other rather than on top of each other, so nothing
            is hidden. In June five moves are open at once.</li>
          <li>A forage is one bar, from driving out to it to the last frame spun; the amber tail is the harvest.
            Click it and you get both pieces of advice.</li>
          <li>On a phone the year runs down the screen instead. Twelve months across 360 pixels is thirty pixels a
            month, which is unreadable, so the picture is for tablet width and up.</li>
        </ul>
        <p>
          Both views are on the iPhone and on Android too, under the same two names. On a phone the
          apps draw the picture wider than the screen and let you drag the year sideways, which is
          a thing a page cannot do comfortably and an app can; on a tablet it fits as it does here.
        </p>
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
        <h2 className="help-section-title">The dates do not fit here</h2>
        <p>Then say so. The 38 entries were written for central Germany and moved elsewhere by a formula, and the only people who can tell whether the formula is right in Andalusia are beekeepers in Andalusia. The questionnaire at <a href="/year-feedback">Rate the beekeeping year</a> takes about a quarter of an hour and needs no account.</p>
        <Screenshot src="/docs/screenshots/year-feedback.png" caption="The questionnaire at Rate the beekeeping year" />
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>You rate your own dates.</strong> Give a country and a postal code first, and the timeline is shifted to that place before you see it.</li>
          <li><strong>Only what you know.</strong> Four answers per entry &mdash; it fits, it happens later here, it happens earlier here, it is not done here at all &mdash; and everything you leave alone is not sent.</li>
          <li><strong>Nothing is asked about you.</strong> Stored are the country, a position rounded to about 11&nbsp;km, and your answers. The postal code is looked up once and then dropped.</li>
        </ul>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Your answer changes no date by itself. Ratings within 150 km of each other are grouped, a group needs at least five beekeepers, and the median correction then goes to somebody who knows the region and can approve it. Once approved, the timeline says how many beekeepers it rests on.</p>
        </div>
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
