import type HelpScreenshot from '@/components/HelpScreenshot';

export default function RemindersContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">What are inspection reminders?</h2>
        <p>
          Inspection reminders notify you when a hive is overdue for a visit based on your chosen
          interval. Consistent inspections are the foundation of good varroa management —
          reminders help you stay on schedule even during busy weeks.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p><strong>Push delivery is coming soon.</strong> You can set your preferences now and they will be saved. Notifications will begin arriving once the push infrastructure is activated.</p>
        </div>
        <Screenshot src="/docs/screenshots/android-settings-reminders.png" caption="Inspection Reminders section in Settings showing the toggle and interval stepper" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Setting up reminders</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Open Settings</strong>
              <p>Tap the Settings tab in the bottom navigation on iOS or Android.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Scroll to Inspection Reminders</strong>
              <p>Enable the toggle to turn reminders on.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Set the reminder interval</strong>
              <p>Choose how many days after the last inspection you want to be reminded. A common choice is 7 days in active season.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Set the season window</strong>
              <p>Choose the months when reminders should be active (e.g. April–September for temperate climates). Outside this window no reminders are sent — there is no need to inspect a wintered colony weekly.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Tap Save Reminder Settings</strong>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Reminder settings explained</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Reminder interval</div>
            <div className="help-stat-card-desc">
              Number of days after the most recent inspection before a reminder fires.
              Common choices: 7 days (weekly) for active varroa management, 14 days for
              light-touch beekeepers, 21–28 days for natural beekeepers.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Season start</div>
            <div className="help-stat-card-desc">
              The first month of the active inspection season. Reminders will not fire before this month.
              In Northern Europe this is typically April or May.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Season end</div>
            <div className="help-stat-card-desc">
              The last month of the active season. After this month reminders are silenced
              until the following season start. In Northern Europe this is typically August or September.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tips</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Set the season window to match your local climate — there's no need to be reminded to inspect a colony that's in winter cluster.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>During the critical pre-winter varroa treatment window (typically August–September), consider temporarily shortening your interval to 7 days to stay on top of mite counts.</p>
        </div>
      </section>
    </>
  );
}
