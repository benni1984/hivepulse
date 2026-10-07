import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HomeAndTreatmentsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Your day at a glance</h2>
        <p>
          The top of the apiary list (and of the dashboard on the website) tells you what matters when you open
          HivePulse. It includes hives that other beekeepers shared with you. Tap a hive to open it.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>
            <strong>Next inspection.</strong> A hive is due your reminder interval after its last inspection (the day
            you entered, not the day you typed it in). You see how many are overdue and how many are due in the next
            three days. A hive never inspected is due that many days after it was created.
          </li>
          <li>
            <strong>State of the hives.</strong> Fine, to watch, alert or unknown, read from the latest inspection:
            <em> alert</em> for high varroa, swarm cells or an aggressive mood; <em>to watch</em> for medium varroa, a
            nervous mood or the queen not seen; <em>unknown</em> for hives never inspected. The hives that need attention
            are listed with the reason.
          </li>
          <li>
            <strong>Upcoming treatments.</strong> What is planned in the next 30 days, overdue ones first, each with a
            <em> Done</em> button.
          </li>
          <li>
            <strong>An announcement.</strong> Now and then a card from us can appear here. It is text only: no
            advertising network, no tracking.
          </li>
        </ul>
        <p>
          The reminder interval and the season are set under <em>Settings &rarr; Inspection reminders</em>. Outside
          the season the dates are worked out the same way and a note says so.
        </p>
        <Screenshot android="/docs/screenshots/android-home-summary.png" web="/docs/screenshots/home-summary.png" caption="The home screen at the top of the apiary list" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Plan a treatment</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Open the hive or the apiary</strong>
              <p>On a hive page choose <em>Treatments</em>. For all hives of an apiary, use the treatments icon in the apiary toolbar.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Product, day and an optional note</strong>
              <p>For example oxalic acid on the day you plan to treat. Tap <em>Plan a treatment</em>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Mark it done</strong>
              <p>Use <em>Done</em> on the home screen or in the list. A treatment done by mistake can be reopened; the last few done ones are listed below.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            Planning is not recording. What you actually applied is still written into the inspection (<em>treatment
            applied</em>). Somebody who was given single hives can plan for those hives, not for the whole apiary.
          </p>
        </div>
        <Screenshot android="/docs/screenshots/android-treatments.png" web="/docs/screenshots/treatments-panel.png" caption="Plan a treatment and tick it off" />
      </section>
    </>
  );
}
