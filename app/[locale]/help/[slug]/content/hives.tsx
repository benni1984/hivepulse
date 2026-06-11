import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HivesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">What is a hive record?</h2>
        <p>
          A hive record represents one physical colony box. It has a name, a type, and an optional
          QR code label. All inspection history is attached to the hive record, so you can view
          the full health trend of that colony over time.
        </p>
        <Screenshot src="/docs/screenshots/android-hive-detail.png" caption="Hive detail screen showing hive type, last inspection date, and inspection list" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Hive types</h2>
        <div className="help-stat-grid">
          {[
            { name: 'Langstroth', desc: 'The most common hive in North America and internationally. Deep and medium boxes with removable frames.' },
            { name: 'Dadant', desc: 'Popular in continental Europe. Larger brood chamber than Langstroth, designed for big colonies.' },
            { name: 'Top Bar', desc: 'Horizontal hive where bees build comb downward from movable bars. Common in East Africa and among natural beekeepers.' },
            { name: 'Warré', desc: 'Vertical stacking hive based on natural comb building. Minimal intervention philosophy.' },
            { name: 'Other', desc: 'Use for any hive type not listed above — nucleus colonies, observation hives, etc.' },
          ].map(h => (
            <div className="help-stat-card" key={h.name}>
              <div className="help-stat-card-name">{h.name}</div>
              <div className="help-stat-card-desc">{h.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 8 }}>
          Choosing the correct type does not affect functionality — it is a label to help you
          tell your hives apart in the list.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Creating a hive</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Open an apiary</strong>
              <p>Tap the apiary name to open its detail view.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tap the + (New Hive) button</strong>
              <p>A form appears asking for a name and hive type.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Choose a name</strong>
              <p>Use whatever naming scheme makes sense to you: "Hive 1", "Blue box", "South meadow A".</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Select a hive type</strong>
              <p>Pick from the list above. You can change this later from the hive detail screen.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Assign a QR code (optional)</strong>
              <p>After saving, open the hive and tap <em>Assign QR</em> to link a printed QR token.
              See <a href="qr-codes">QR Codes</a> for the full workflow.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/hive-create-form.png" caption="New hive form with name field and hive type picker" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Viewing a hive</h2>
        <p>
          The hive detail screen shows:
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Hive type and the date it was added</li>
          <li>Date of the last inspection</li>
          <li>Full inspection history, newest first</li>
          <li>A button to start a new inspection</li>
          <li>On web: tabs for Inspections, Stats, and Custom Fields</li>
        </ul>
        <Screenshot src="/docs/screenshots/hive-detail-web.png" caption="Hive detail page on the web showing the inspections tab and hive metadata" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tips</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Give each hive a short, unique name. When you have many hives, names like "A1" or "Top garden" are easier to read in the list than "Hive 1", "Hive 2", "Hive 3".</p>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Deleting a hive permanently removes all inspection history for that colony. Export your data before deleting if you want to keep records.</p>
        </div>
      </section>
    </>
  );
}
