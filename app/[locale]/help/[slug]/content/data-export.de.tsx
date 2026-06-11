import type HelpScreenshot from '@/components/HelpScreenshot';

export default function DataExportContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Warum exportieren?</h2>
        <p>
          Ihre Inspektionsdaten gehören Ihnen. Durch den Export erhalten Sie eine lokale Kopie, die Sie mit
          Ihrem Tierarzt teilen, bei einer nationalen Imkerbehörde einreichen, in einer Tabellenkalkulation für
          benutzerdefinierte Analysen verwenden oder als Langzeitaufzeichnung unabhängig von HivePulse archivieren können.
        </p>
        <Screenshot android="/docs/screenshots/android-data-export.png" web="/docs/screenshots/hive-detail-export-area.png" caption="Datenexport — Bienenstandauswahl und Formatauswahl (JSON / CSV)" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Exportformate</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">JSON</div>
            <div className="help-stat-card-desc">
              Maschinenlesbares Format. Bewahrt alle Felder einschließlich benutzerdefinierter Felder mit ihren genauen
              Werten. Am besten für die Archivierung oder den Import in ein anderes System. Die Struktur entspricht
              dem HivePulse-API-Vertrag.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">CSV</div>
            <div className="help-stat-card-desc">
              Tabellenkalkulationskompatibel. Jede Inspektion ist eine Zeile. Öffnet sich direkt in Excel, Google
              Tabellen oder Numbers. Benutzerdefinierte Felder sind als zusätzliche Spalten enthalten.
              Am besten für manuelle Analysen oder die Weitergabe an nicht-technische Stakeholder.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">So exportieren Sie (Web)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Zu Einstellungen gehen</strong>
              <p>Im Dashboard öffnen Sie <strong>Einstellungen → Daten exportieren</strong>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Bienenstand auswählen</strong>
              <p>Wenn Sie mehr als einen Bienenstand haben, wählen Sie, welchen Sie exportieren möchten. Jeder Export umfasst alle Völker und Inspektionen innerhalb dieses Bienenstands.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>JSON oder CSV wählen</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Herunterladen klicken</strong>
              <p>Die Datei wird in den Standard-Download-Ordner Ihres Browsers heruntergeladen.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/hive-detail-export-area.png" caption="Export-Dialog im Web — Bienenstand ausgewählt, CSV-Format gewählt" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">So exportieren Sie (iOS &amp; Android)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Einstellungen öffnen</strong>
              <p>Tippen Sie auf den Einstellungs-Tab in der unteren Navigationsleiste.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Zu Datenexport scrollen</strong>
              <p>Dieser Abschnitt erscheint nur, wenn Sie mindestens einen Bienenstand haben.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Auf Daten exportieren tippen</strong>
              <p>Ein Blatt erscheint mit der Bienenstandauswahl und dem Formatselektor.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Auf Herunterladen tippen</strong>
              <p>Unter iOS öffnet sich das System-Teilen-Blatt, sodass Sie in Dateien speichern, per E-Mail versenden oder per AirDrop teilen können. Unter Android wird die Datei mit einer Toast-Benachrichtigung in Ihrem Download-Ordner gespeichert.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Was im Export enthalten ist</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Alle Völker im ausgewählten Bienenstand</li>
          <li>Jede Inspektion für jedes Volk mit allen integrierten Feldern</li>
          <li>Alle benutzerdefinierten Feldwerte</li>
          <li>Inspektionsdaten und Erstellungszeitstempel</li>
        </ul>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Exporte enthalten keine Fotos (HivePulse speichert keine Inspektionsfotos). Sie enthalten auch keine QR-Token-Daten oder Charge-Informationen.</p>
        </div>
      </section>
    </>
  );
}
