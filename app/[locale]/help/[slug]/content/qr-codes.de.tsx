import type HelpScreenshot from '@/components/HelpScreenshot';

export default function QrCodesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Warum QR-Codes verwenden?</h2>
        <p>
          Wenn Sie im Bienenstand Handschuhe tragen, ist es mühsam, das richtige Volk in einer Handy-App zu finden.
          Ein QR-Code-Etikett auf jedem Bienenstock ermöglicht es Ihnen, in unter zwei Sekunden zu scannen und zu öffnen — der korrekte
          Volk-Detailbildschirm öffnet sich sofort, bereit für eine neue Inspektion.
        </p>
        <Screenshot android="/docs/screenshots/android-qr-batches.png" web="/docs/screenshots/qr-batch-detail.png" caption="QR-Code-Etikett auf einem Bienenstock, bereit zum Scannen" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Schritt 1 — Charge generieren (Web)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Zu QR-Chargen gehen</strong>
              <p>Im Web-Dashboard öffnen Sie <strong>Einstellungen → QR-Chargen</strong> (oder navigieren direkt zu <code>/dashboard/qr-batches</code>).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Auf + Neue Charge tippen</strong>
              <p>Geben Sie die Anzahl der zu generierenden Codes ein (1–50). Ein Code pro physischem Bienenstock.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>PDF herunterladen</strong>
              <p>Öffnen Sie die neue Charge und klicken Sie auf <em>PDF herunterladen</em>. Das PDF enthält einen QR-Code pro Seite, in der Größe für Standard-Etikettbögen.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Drucken und befestigen</strong>
              <p>Drucken Sie wenn möglich auf wetterfestem Etikettpapier. Kleben Sie ein Etikett auf jeden Bienenstock — der Deckel ist eine gute Stelle.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/qr-batch-detail.png" caption="QR-Charge-Detailseite mit der Token-Liste und der PDF-Download-Schaltfläche" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Schritt 2 — Code mit Volk verknüpfen (Mobil)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Volk-Detailbildschirm öffnen</strong>
              <p>Navigieren Sie zum Volk, das Sie verknüpfen möchten (über die Bienenstandliste).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Auf QR zuweisen / Volk initialisieren tippen</strong>
              <p>Die Kamera öffnet sich im Scan-Modus.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Gedrucktes Etikett scannen</strong>
              <p>Richten Sie die Kamera auf den QR-Code auf dem Etikett. Das Token wird automatisch gelesen — kein Tastendruck erforderlich.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Verknüpfung bestätigen</strong>
              <p>Ein Bestätigungsbildschirm zeigt den Volksnamen. Tippen Sie auf <em>Bestätigen</em>, um abzuschließen. Das QR-Token ist nun dauerhaft mit diesem Volk verknüpft.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-qr-scan.png" caption="QR-Scanner-Overlay mit einem gescannten Code und dem Bestätigungsblatt" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Schritt 3 — Bei Inspektionen scannen und öffnen</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Scan-Symbol antippen</strong>
              <p>Der QR-Scanner ist in der unteren Navigationsleiste auf iOS und Android verfügbar.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Auf das Beuten-Etikett zeigen</strong>
              <p>Die App liest den Code und öffnet sofort den Volk-Detailbildschirm.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Auf Neue Inspektion tippen</strong>
              <p>Sie befinden sich jetzt beim richtigen Volk und können Ihren Besuch protokollieren.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-qr-scan.png" caption="Scannen eines Beuten-QR-Codes im Feld — das Volk öffnet sich sofort" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tipps</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Verwenden Sie wetterfestes Etikettenträgermaterial (Polypropylen oder laminiertes Papier). Standard-Papier-Etiketten verschlechtern sich im Freien schnell, besonders bei Regen und direkter Sonneneinstrahlung.</p>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Jedes QR-Token kann nur mit einem Volk verknüpft werden. Wenn Sie ein Etikett wiederverwenden müssen (z. B. das Volk wurde geteilt), generieren Sie eine neue Charge — alte Token bleiben dauerhaft mit ihrem ursprünglichen Volk verbunden.</p>
        </div>
      </section>
    </>
  );
}
