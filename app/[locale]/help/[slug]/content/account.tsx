import type HelpScreenshot from '@/components/HelpScreenshot';

export default function AccountContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Editing your profile</h2>
        <p>
          Your profile stores your display name and preferred language. The display name
          appears in the admin panel if your account has admin privileges. The language
          setting controls which locale the mobile apps use for UI labels.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Web:</strong> Go to <strong>Dashboard → Profile</strong> (<code>/dashboard/profile</code>).
              <strong> Mobile:</strong> Open the Settings tab.
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Edit your display name</strong>
              <p>Type the new name and tap Save Profile / Save.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Change language</strong>
              <p>Select English, French, German, or Spanish from the language picker.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-settings-account.png" caption="Profile section in Settings showing the display name field and language picker" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Changing your password</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Open the Change Password section</strong>
              <p>On web: Dashboard → Profile. On mobile: Settings → scroll down to Change Password.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Enter your current password</strong>
              <p>This confirms you are the account owner.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Enter and confirm your new password</strong>
              <p>Minimum 8 characters.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Tap Change Password</strong>
              <p>You remain logged in. All other active sessions remain valid.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Forgot your current password? Use the <strong>Forgot password</strong> link on the login screen to receive a reset link by email.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Deleting your account</h2>
        <p>
          Deleting your account permanently removes your email address, display name, all apiaries,
          all hives, and all inspection records. This action <strong>cannot be undone</strong>.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Export your data first</strong>
              <p>Download a JSON or CSV export of each apiary if you want to keep your records.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Open Danger Zone</strong>
              <p>On web: Dashboard → Profile → Danger Zone. On mobile: Settings → scroll to the bottom.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Tap Delete Account and confirm</strong>
              <p>A confirmation dialog explains what will be deleted. Confirm to proceed.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Your inspection data may have contributed to community statistics. Deleting your account removes your data from future community aggregates but historical statistics already computed are not retroactively recalculated.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Logging out</h2>
        <p>
          Tap <strong>Log Out</strong> in Settings (mobile) or in the top-right dropdown (web).
          Your session token is revoked server-side. You will be redirected to the login screen.
          Your data is preserved — logging out does not delete anything.
        </p>
      </section>
    </>
  );
}
