import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HornetTrapsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">What is a named trap?</h2>
        <p>
          A named trap is a physical Asian hornet trap that has been registered in HivePulse.
          Each trap gets an <strong>8-character access code</strong>. Anyone who knows the code —
          you, a neighbour, a volunteer, a field researcher — can log daily catch counts against
          that trap without needing a HivePulse account.
        </p>
        <p>
          Named traps make it easy to run distributed monitoring networks: register traps at
          multiple locations, share the access codes with local beekeeping associations, and
          collect catch data from the community.
        </p>
        <Screenshot caption="Trap detail screen showing the access code, catch history, and log-catch button" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Registering a trap</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Go to Hornets → Traps</strong>
              <p>Navigate to <strong>/hornets/traps</strong> on the web, or open the Hornet Traps screen on mobile.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tap Register New Trap</strong>
              <p>Enter a name (e.g. "North fence"), GPS coordinates, and an optional description.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Save</strong>
              <p>Your trap is registered and an 8-character access code is generated. Note it down or share it.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Register trap form showing name, GPS, and the generated access code" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Logging a daily catch</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Enter the access code</strong>
              <p>On the Traps page, type the 8-character code in the search box. The trap opens without any login.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tap Log Today's Catch</strong>
              <p>Enter the number of hornets caught since the last check.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Save</strong>
              <p>Only one catch per trap per day is stored — submitting again today updates the existing record.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Finding traps near you</h2>
        <p>
          The <strong>Nearby</strong> tab on the Traps page shows registered traps within 50 metres
          of your current GPS location. This is useful when you're in the field and want to log
          a catch for a trap you manage but don't remember the access code for.
        </p>
        <Screenshot caption="Nearby traps list showing two traps within 50 m, with distances" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Trap map</h2>
        <p>
          All registered traps appear as blue pins on the Hornets map at <strong>/hornets/map</strong>.
          This gives local beekeeping associations an overview of coverage gaps — areas with no trap
          and high nest density that would benefit from a new trap placement.
        </p>
      </section>
    </>
  );
}
