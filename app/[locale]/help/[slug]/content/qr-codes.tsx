import type HelpScreenshot from '@/components/HelpScreenshot';

export default function QrCodesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Why use QR codes?</h2>
        <p>
          When you're in the apiary wearing gloves, finding the right hive in a phone app is slow.
          A QR code label on each hive box lets you scan-and-open in under two seconds — the correct
          hive detail screen opens instantly, ready for a new inspection.
        </p>
        <Screenshot src="/docs/screenshots/android-qr-batches.png" caption="QR code label on a hive box, ready to be scanned" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Step 1 — Generate a batch (web)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Go to QR Batches</strong>
              <p>In the web dashboard, open <strong>Settings → QR Batches</strong> (or navigate directly to <code>/dashboard/qr-batches</code>).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tap + New Batch</strong>
              <p>Enter the number of codes to generate (1–50). One code per physical hive box.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Download the PDF</strong>
              <p>Open the new batch and click <em>Download PDF</em>. The PDF contains one QR code per page, sized for standard label sheets.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Print and attach</strong>
              <p>Print on weatherproof label paper if possible. Stick one label on each hive box — the lid is a good spot.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/qr-batch-detail.png" caption="QR Batch detail page showing the list of tokens and the Download PDF button" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Step 2 — Link a code to a hive (mobile)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Open the hive detail screen</strong>
              <p>Navigate to the hive you want to link (via the apiary list).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tap Assign QR / Initialize Hive</strong>
              <p>The camera opens in scanning mode.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Scan the printed label</strong>
              <p>Point the camera at the QR code on the label. The token is read automatically — no button press needed.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Confirm the link</strong>
              <p>A confirmation screen shows the hive name. Tap <em>Confirm</em> to finish. The QR token is now permanently linked to that hive.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-qr-scan.png" caption="QR scanner overlay showing a code being scanned and the confirmation sheet" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Step 3 — Scan to open during inspections</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Tap the scan icon</strong>
              <p>The QR scanner is available from the bottom navigation bar on both iOS and Android.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Point at the hive label</strong>
              <p>The app reads the code and immediately opens the hive detail screen.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Tap New Inspection</strong>
              <p>You're now on the correct hive, ready to log your visit.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-qr-batches.png" caption="Scanning a hive QR code in the field — the hive opens instantly" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tips</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Use weatherproof label stock (polypropylene or laminated paper). Standard paper labels deteriorate quickly outdoors, especially in rain and direct sun.</p>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Each QR token can only be linked to one hive. If you need to reuse a label (e.g. the hive was split), generate a new batch — old tokens remain locked to their original hive.</p>
        </div>
      </section>
    </>
  );
}
