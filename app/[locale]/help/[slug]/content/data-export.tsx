import type HelpScreenshot from '@/components/HelpScreenshot';

export default function DataExportContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Why export?</h2>
        <p>
          Your inspection data belongs to you. Exporting gives you a local copy that you can share
          with your veterinarian, submit to a national beekeeping authority, use in a spreadsheet for
          custom analysis, or archive as a long-term record independent of HivePulse.
        </p>
        <Screenshot caption="Data export sheet on mobile showing the apiary picker and format selector" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Export formats</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">JSON</div>
            <div className="help-stat-card-desc">
              Machine-readable format. Preserves all fields including custom fields with their exact
              values. Best for archiving or importing into another system. The structure matches
              the HivePulse API contract.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">CSV</div>
            <div className="help-stat-card-desc">
              Spreadsheet-compatible. Each inspection is one row. Opens directly in Excel, Google
              Sheets, or Numbers. Custom fields are included as additional columns.
              Best for manual analysis or sharing with non-technical stakeholders.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">How to export (web)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Go to Settings</strong>
              <p>In the dashboard, open <strong>Settings → Export Data</strong>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Select the apiary</strong>
              <p>If you have more than one apiary, pick which one to export. Each export covers all hives and inspections within that apiary.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Choose JSON or CSV</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Click Download</strong>
              <p>The file downloads to your browser's default downloads folder.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Export dialog on the web — apiary selected, CSV format chosen" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">How to export (iOS &amp; Android)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Open Settings</strong>
              <p>Tap the Settings tab in the bottom navigation bar.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Scroll to Data Export</strong>
              <p>This section only appears when you have at least one apiary.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Tap Export Data</strong>
              <p>A sheet appears with the apiary picker and format selector.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Tap Download</strong>
              <p>On iOS the system share sheet opens so you can save to Files, email, or AirDrop. On Android the file is saved to your Downloads folder with a toast notification.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">What is included in the export</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>All hives in the selected apiary</li>
          <li>Every inspection for each hive, with all built-in fields</li>
          <li>All custom field values</li>
          <li>Inspection dates and creation timestamps</li>
        </ul>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Exports do not include photos (HivePulse does not store inspection photos). They also do not include QR token data or batch information.</p>
        </div>
      </section>
    </>
  );
}
