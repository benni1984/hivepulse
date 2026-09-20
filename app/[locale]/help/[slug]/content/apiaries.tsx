import type HelpScreenshot from '@/components/HelpScreenshot';

export default function AviariesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">What is an apiary?</h2>
        <p>
          An apiary is a named location that groups one or more hive boxes together. It represents
          a physical place — your garden, a field, a rooftop — where your colonies live.
          Every hive in HivePulse belongs to exactly one apiary.
        </p>
        <p>
          Apiaries can be made <strong>public</strong>, which adds a map pin to the community map
          and contributes your anonymised inspection data to the platform-wide statistics that
          all beekeepers can see on the Members screen.
        </p>
        <Screenshot src="/docs/screenshots/dashboard-apiary-list.png" caption="Apiary list on the web dashboard showing two apiaries with hive counts" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Creating an apiary</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Open the apiary list</strong>
              <p>On the web go to <strong>/dashboard</strong>. On iOS or Android it is the first screen after login.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tap the + button</strong>
              <p>A creation form slides up with the following fields.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Fill in the details</strong>
              <p><strong>Name</strong> (required) — a short label like "Home garden" or "Forest edge".<br/>
              <strong>Description</strong> — optional notes visible only to you.<br/>
              <strong>Address</strong> — optional free-text address.<br/>
              <strong>Latitude &amp; Longitude</strong> — decimal coordinates for the map pin. If you leave these blank the apiary will not appear on the map even if made public.<br/>
              <strong>Make public</strong> — tick to share the location and anonymised stats with the community.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Save</strong>
              <p>The new apiary appears in your list immediately.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/apiary-create-form.png" caption="Apiary creation form showing name, description, and GPS fields" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Editing an apiary — and going public later</h2>
        <p>
          Everything you entered when creating an apiary can be changed afterwards, including
          whether it appears on the community map. You do not have to create a new apiary for that.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Web</strong> — open the apiary and press <strong>Edit</strong> above the hive list.</li>
          <li><strong>iPhone and Android</strong> — open the apiary and tap the pencil in the title bar.</li>
        </ul>
        <p>
          The form holds name, description, address and the <strong>Show on public map</strong> switch.
          Turning that switch on is what puts the apiary on the community map and makes its inspections
          count towards the community figures; turning it off removes it again.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>If the community map and the member statistics show zero for you, this switch is usually the reason: private apiaries are never counted.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Public vs private apiaries</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Private (default)</div>
            <div className="help-stat-card-desc">
              Only you can see the apiary, its hives, and all inspection data. Nothing is shared with the community.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Public</div>
            <div className="help-stat-card-desc">
              A map pin appears on the community map at your GPS coordinates. Your inspection records
              contribute to the platform-wide statistics (averages only — individual records are never exposed).
              No user-identifiable information is published.
            </div>
          </div>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Your GPS coordinates are stored at <strong>city-level precision</strong> — the exact pin is rounded to protect your privacy.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Deleting an apiary</h2>
        <p>
          On the web, open the apiary detail page and scroll to the danger zone. On mobile, swipe left
          on the apiary row. <strong>An apiary can only be deleted when it contains no hives.</strong> Delete
          all hives first, then delete the apiary.
        </p>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Deleting an apiary is permanent — all hives and their inspection history will be lost. Export your data first if you need a copy.</p>
        </div>
      </section>
    </>
  );
}
