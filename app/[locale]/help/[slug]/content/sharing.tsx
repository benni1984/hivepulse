import type HelpScreenshot from '@/components/HelpScreenshot';

export default function SharingContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Working on an apiary together</h2>
        <p>
          Two beekeepers can look after the same apiary, or after single hives, together. You invite the other
          person by e-mail address; once they accept, you both see the same hives and inspections, and you can both
          record inspections, edit hives and add hives.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            <strong>What stays with the owner.</strong> The person who made the apiary is its owner. Only the owner can
            delete an apiary or a hive, make an apiary public on the community map, move hives, and invite or remove
            people. A collaborator can always leave.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Share the whole apiary or single hives</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>An apiary</strong> shares the apiary and every hive in it, including hives you add later.</li>
          <li>
            <strong>A single hive</strong> shares only that hive. The other person sees the name of its apiary to find
            their way, but none of its other hives, and cannot edit the apiary or add hives to it.
          </li>
        </ul>
        <p>To share some hives but not all of an apiary, put them in an apiary of their own and share that.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Invite someone</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Open the apiary or the hive</strong>
              <p>On the website use <em>Work together</em> on the page; in the apps tap the people icon in the toolbar.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Enter the e-mail address and send</strong>
              <p>The invitation stays <em>pending</em> until it is accepted. You can withdraw it from the same screen.</p>
            </div>
          </li>
        </ol>
        <Screenshot android="/docs/screenshots/android-sharing.png" web="/docs/screenshots/sharing-panel.png" caption="Invite another beekeeper by e-mail" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Accept an invitation</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>
            <strong>You already have an account</strong> with that address: the invitation appears at the top of your
            apiary list with <em>Accept</em> and <em>Decline</em>. An e-mail tells you about it as well.
          </li>
          <li>
            <strong>You do not have an account yet:</strong> the e-mail contains a link. Open it, register or sign in
            with that address, and accept. If you sign in with Apple or Google, the invitation is already waiting in your apiary
            list and you only tap <em>Accept</em>. If you signed up with a password in the app, scroll to the end of the
            apiary list, tap <em>Redeem an invitation link</em> and paste the link.
          </li>
        </ul>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Stop sharing</h2>
        <p>
          The owner removes a person on the same <em>Work together</em> screen; the apiary or hive disappears from the
          other person&rsquo;s list at once. A collaborator can leave from their side. Inspections you recorded stay
          with the hive.
        </p>
      </section>
    </>
  );
}
