import type HelpScreenshot from '@/components/HelpScreenshot';

export default function CustomFieldsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">What are custom fields?</h2>
        <p>
          Custom fields let you add extra questions to the inspection form that aren't in the
          built-in set. For example: a checkbox for "artificial swarm done", a number for
          "frames of stores", or a dropdown for the nectar source currently in bloom.
        </p>
        <p>
          Fields are currently managed on the <strong>web dashboard</strong> and appear on the
          inspection form across all platforms.
        </p>
        <Screenshot src="/docs/screenshots/custom-fields-list.png" caption="Custom Fields settings page showing a list of user-scope fields" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Field scope</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">User scope</div>
            <div className="help-stat-card-desc">
              Applies to <strong>every inspection across all your apiaries</strong>. Use for fields
              that are always relevant to your practice — e.g. "treatment type" or "artificial swarm".
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Apiary scope</div>
            <div className="help-stat-card-desc">
              Applies only to inspections <strong>within one specific apiary</strong>. Use for fields
              that are only relevant at one location — e.g. "proximity to oilseed rape" for an
              apiary near a rapeseed field.
            </div>
          </div>
        </div>
        <p style={{ marginTop: 8 }}>
          If a user-scope field and an apiary-scope field have the same name, the apiary-scope
          field takes precedence for hives in that apiary.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Field types</h2>
        <div className="help-stat-grid">
          {[
            { name: 'Text', desc: 'A free-text input. Good for notes, observations, or any open-ended answer.' },
            { name: 'Number', desc: 'A numeric input. Stored as a decimal — useful for measurements like frame counts or weights.' },
            { name: 'Boolean', desc: 'A yes/no toggle. Best for actions done or not done: "fed today", "new comb drawn".' },
            { name: 'Date', desc: 'A date picker. Use for recording specific events — "last treatment date", "queen introduced on".' },
            { name: 'Select', desc: 'A dropdown with your own options. Useful for categorical data — "nectar source", "treatment product".' },
          ].map(f => (
            <div className="help-stat-card" key={f.name}>
              <div className="help-stat-card-name">{f.name}</div>
              <div className="help-stat-card-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Creating a custom field</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Go to Field Definitions</strong>
              <p>In the web dashboard, navigate to <strong>Dashboard → Field Definitions</strong>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Choose the target</strong>
              <p><strong>Hive</strong> fields appear on the hive detail form. <strong>Inspection</strong> fields appear on the inspection form — this is the most common choice.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Choose scope</strong>
              <p>User (all apiaries) or Apiary (one specific apiary).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Name the field and choose a type</strong>
              <p>For Select fields, also enter the dropdown options (one per line).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Save</strong>
              <p>The field appears immediately on the inspection form for the relevant apiaries.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/custom-field-create.png" caption="Creating a new custom field — name, type, and scope are selected" />
      </section>
    </>
  );
}
