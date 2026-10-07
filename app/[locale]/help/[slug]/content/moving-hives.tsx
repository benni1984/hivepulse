import type HelpScreenshot from '@/components/HelpScreenshot';

export default function MovingHivesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Taking hives to the bloom</h2>
        <p>
          Migratory beekeepers take their hives to where something is in bloom: acacia, rapeseed, fir, heather. Moving
          hives is one action: you pick the hives, the new place, the day and the forage. Every move is kept, so you
          always see where a hive has stood and when.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Move hives</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Open the apiary the hives stand in</strong>
              <p>Tap <em>Move hives</em> (the two arrows in the toolbar; on the website the button on the apiary page).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Choose the hives</strong>
              <p>Single hives, or all of them with <em>All hives</em>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Choose where they go</strong>
              <p>
                One of your other apiaries, or <em>A new place</em> with a name and an address. HivePulse looks the
                address up so the place can be drawn on the map.
              </p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Day, forage and note</strong>
              <p>The day is today unless you change it (it cannot be in the future). Pick a forage or write your own, and add a note if you like.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            <strong>Back to where they came from.</strong> If hives were taken to this apiary before, buttons such as
            &ldquo;Back to Field (3)&rdquo; appear at the top of the form. One tap selects those hives and their previous
            place; you only confirm the day.
          </p>
        </div>
        <Screenshot src="/docs/screenshots/android-moves.png" caption="Choose the hives, the new place, the day and the forage" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Where a hive has stood</h2>
        <p>
          Each hive page has <em>Where this hive has stood</em>: its journey on a map and the list of its moves. The
          <em> Map of moves</em> (the map icon in the apiary list toolbar, or in the dashboard menu on the website) draws the journey of
          every hive, numbered stop by stop, and can be narrowed to a period.
        </p>
        <Screenshot android="/docs/screenshots/android-moves-overview.png" web="/docs/screenshots/moves-overview.png" caption="The map of moves draws the journey of every hive" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Good to know</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Only the owner of an apiary can move its hives.</li>
          <li>A hive keeps its QR code and all its inspections when it moves.</li>
          <li>An apiary that is empty stays; it waits for the next season.</li>
          <li>Moving within the same apiary is not possible, there is nothing to move.</li>
          <li>For the map, both places need coordinates or an address.</li>
        </ul>
      </section>
    </>
  );
}
