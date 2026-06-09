import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HornetTrackerContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Why track Asian hornets?</h2>
        <p>
          <em>Vespa velutina</em> (the Asian hornet) is an invasive predator that hunts honeybees
          at hive entrances, dramatically reducing foraging and colony strength. Early detection and
          nest destruction are the most effective control measures. HivePulse's Hornet Tracker
          lets any citizen — no account required — contribute sightings, and lets beekeepers
          monitor nest density in their area.
        </p>
        <Screenshot caption="Hornet Tracker landing page showing aggregate stats and action links" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Reporting a catch</h2>
        <p>
          A "catch" is the number of hornets captured in a trap over a period of time.
          Reports do not require an account.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Go to Hornets → Report</strong>
              <p>Navigate to <strong>/hornets/report</strong> on the web.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Enter your catch count and optional location</strong>
              <p>Adding GPS coordinates places your catch on the map, helping authorities track spread patterns.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Submit</strong>
              <p>Your report is added to the community catch total immediately.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Catch report form with count input and optional GPS fields" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Reporting a nest</h2>
        <p>
          Nest reports include a GPS location and current status (Found / Destruction ordered / Destroyed).
          Confirmed nests appear as red pins on the Hornets map.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Go to Hornets → Report</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Switch to the Nest tab</strong>
              <p>Enter latitude, longitude, and nest status.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Submit</strong>
              <p>The nest appears on the map for other beekeepers and local authorities to see.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Photo sightings &amp; community voting</h2>
        <p>
          The community sightings feed lets users submit a photo of a suspected Asian hornet
          for others to verify. Misidentification is common (Asian hornets are often confused
          with European hornets and hoverflies), so community voting helps filter accurate reports.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Go to Hornets → Community Sightings</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Browse the feed</strong>
              <p>Each card shows the photo, submission date, and current Yes/No vote count.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Vote Yes or No</strong>
              <p>Cast one vote per sighting. Admins can override the status to Confirmed or Rejected.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Submit your own photo</strong>
              <p>Tap the + button, upload a photo, and add optional location data.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Community sightings feed showing photo cards with vote counts" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Reading the stats</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Total caught</div>
            <div className="help-stat-card-desc">All hornets reported as caught across all trap reports platform-wide. A rising total signals an active season.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Nests found</div>
            <div className="help-stat-card-desc">Number of nest reports submitted. High nest counts in your region mean a higher predation risk at your apiary.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Nests destroyed</div>
            <div className="help-stat-card-desc">Nests with status "Destroyed". Tracks the effectiveness of local control efforts.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Pending sightings</div>
            <div className="help-stat-card-desc">Community photo sightings awaiting enough votes to confirm or reject. Help reduce this number by voting on open sightings.</div>
          </div>
        </div>
      </section>
    </>
  );
}
