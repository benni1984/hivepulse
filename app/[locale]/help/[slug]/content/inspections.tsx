import type HelpScreenshot from '@/components/HelpScreenshot';

export default function InspectionsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">What is an inspection?</h2>
        <p>
          An inspection is a single visit to a hive. Every time you open a hive box, you record
          what you observe as an inspection record: health indicators, population data, queen status,
          and any treatments or feeding you applied. Over time, these records build a picture of
          colony health that charts and trend analysis can reveal.
        </p>
        <Screenshot src="/docs/screenshots/android-inspection-form.png" caption="Inspection form open on a hive, showing all sections" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Logging an inspection</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Open the hive</strong>
              <p>Navigate to the hive detail screen — via the apiary list or by scanning the QR code on the box.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tap New Inspection</strong>
              <p>The inspection form opens. The date defaults to today but can be changed (for back-dating past visits).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Fill in what you observe</strong>
              <p>Only the date is required. All other fields are optional — record what you checked and skip the rest.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Save</strong>
              <p>The inspection is added to the hive's history and contributes to trend charts immediately.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-inspection-form-bottom.png" caption="Saving an inspection — the date and varroa count fields are visible" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">All inspection fields explained</h2>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Colony health</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Varroa count</div>
            <div className="help-stat-card-desc">
              Number of Varroa destructor mites found in a sample wash (sugar roll or alcohol wash of ~100 bees).
              This is the most important health indicator — high mite loads reduce worker lifespan, weaken the colony, and transmit viruses.
            </div>
            <span className="help-stat-card-good">Good: 0–2 mites per 100</span>{' '}
            <span className="help-stat-card-warn">Act: 3+ mites per 100</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Colony mood</div>
            <div className="help-stat-card-desc">
              How the bees behaved during the inspection.
              <br /><strong>Calm</strong> — bees were gentle, moved slowly, few stings.<br />
              <strong>Nervous</strong> — bees were agitated, difficult to work with.<br />
              <strong>Aggressive</strong> — bees actively attacked, multiple stings.
            </div>
            <span className="help-stat-card-good">Goal: mostly Calm</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Queen seen</div>
            <div className="help-stat-card-desc">
              Check this if you visually confirmed the queen during the inspection.
              If you see fresh eggs but not the queen herself, leave it unchecked — eggs are indirect evidence only.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Queen colour</div>
            <div className="help-stat-card-desc">
              The international SICAMM colour coding by year. White (years ending 1/6), Yellow (2/7),
              Red (3/8), Green (4/9), Blue (5/0). Helps you track the queen's age.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Swarm cells seen</div>
            <div className="help-stat-card-desc">
              Check this if you spotted queen cells being built for swarming. This is an early warning
              that the colony may swarm within days.
            </div>
            <span className="help-stat-card-warn">Action required if checked</span>
          </div>
        </div>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: '24px 0 12px', color: 'var(--text-primary)' }}>Population</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Brood frames</div>
            <div className="help-stat-card-desc">
              Number of frames containing brood (eggs, larvae, or capped cells). This measures colony growth
              potential. A strong, healthy colony in peak season typically fills 7–9 frames in a standard Langstroth.
            </div>
            <span className="help-stat-card-good">Good (spring/summer): 6–9 frames</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Honey frames</div>
            <div className="help-stat-card-desc">
              Number of frames containing stored honey. Important for monitoring winter food stores.
              A colony needs roughly 15–20 kg of honey to survive a cold winter.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Population strength</div>
            <div className="help-stat-card-desc">
              Subjective 1–5 scale for overall colony strength. Useful when you want to track relative
              population without counting individual frames.
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: '24px 0 12px', color: 'var(--text-primary)' }}>Weight & treatment</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Weight (kg)</div>
            <div className="help-stat-card-desc">
              Total hive weight from a hive scale. Tracking weight over time shows nectar flows and
              winter stores consumption without opening the hive.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Treatment applied</div>
            <div className="help-stat-card-desc">
              Free-text field to note any varroa treatment, antibiotic, or other medication used.
              Keeping treatment records is a legal requirement in many countries.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Feeding done</div>
            <div className="help-stat-card-desc">
              Checkbox to record that you fed the colony. Use the Notes field to specify the type and amount.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Feeding type</div>
            <div className="help-stat-card-desc">
              What you fed: sugar syrup, fondant, pollen substitute, etc.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tips</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Record varroa counts consistently using the same method each time (sugar roll or alcohol wash) so the trend chart is comparable across inspections.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Even a partial inspection (just mood and brood frames) is valuable. Consistent partial records beat perfect records that happen once a year.</p>
        </div>
      </section>
    </>
  );
}
