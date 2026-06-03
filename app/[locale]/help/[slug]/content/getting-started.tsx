import type HelpScreenshot from '@/components/HelpScreenshot';

export default function GettingStartedContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">What is HivePulse?</h2>
        <p>
          HivePulse is a beekeeping inspection and community platform for iOS, Android, and the web.
          It lets you log every hive visit — varroa counts, colony mood, queen sightings, brood frames,
          and more — and turns that data into charts and trend analysis over time.
        </p>
        <p>
          Every inspection you record also contributes (anonymously) to platform-wide statistics
          that help the broader beekeeping community understand colony health trends across regions.
        </p>
        <Screenshot caption="HivePulse dashboard showing apiary overview and hive list" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">The three apps</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-globe" style={{ marginRight: 6 }} />Web dashboard</div>
            <div className="help-stat-card-desc">
              Full-featured dashboard at <strong>apiscan-two.vercel.app</strong>. Best for managing apiaries,
              viewing detailed charts, generating QR batches, and exporting data. Works on any browser.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fab fa-apple" style={{ marginRight: 6 }} />iOS app</div>
            <div className="help-stat-card-desc">
              Native iPhone app optimised for field use. Scan a QR code on a hive box to open it instantly,
              log an inspection, and view hive stats — all without opening a browser.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fab fa-android" style={{ marginRight: 6 }} />Android app</div>
            <div className="help-stat-card-desc">
              Native Android app with the same field-first design. Supports QR scanning via the camera
              and works on phones running Android 8 (API 26) and above.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Creating your account</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Open the registration page</strong>
              <p>Go to <strong>/dashboard/register</strong> on the web, or tap <em>Create account</em> on the login screen of the mobile apps.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Enter your details</strong>
              <p>Provide an email address, a display name, your preferred language (English, French, German, or Spanish), and a password of at least 8 characters.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Start adding apiaries</strong>
              <p>After registering you land on the apiary list. Tap the <strong>+</strong> button to create your first apiary.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Registration form on the web dashboard" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Recommended first steps</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Create an apiary</strong>
              <p>Give it a name and optionally a GPS location so it appears on the community map.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Add your hives</strong>
              <p>Create one entry per physical hive box. Choose the hive type that matches your equipment.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Generate and print QR codes</strong>
              <p>From the web, generate a QR batch and print the PDF. Attach one label to each hive box.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Log your first inspection</strong>
              <p>Scan the QR code with your phone, tap <em>New Inspection</em>, and fill in what you observe.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Log inspections consistently — even if you only record the varroa count — and HivePulse will build meaningful trend charts after a few visits.</p>
        </div>
      </section>
    </>
  );
}
