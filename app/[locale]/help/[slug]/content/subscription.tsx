import type HelpScreenshot from '@/components/HelpScreenshot';

export default function SubscriptionContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">What is free</h2>
        <p>HivePulse is free for up to 10 colonies, with as many apiaries as you like. Ten covers the beekeeper with a few hives behind the house, who should never be asked for money.</p>
        <p>Beyond ten, a supporter subscription costs €19.99 a year. A year rather than a month because beekeeping is seasonal: almost everything happens between March and October, and a monthly subscription would invite a cancellation every autumn.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">What reaching the limit never does</h2>
        <p><strong>Reaching a limit never closes what already exists.</strong></p>
        <p>Nothing is hidden, nothing becomes read-only, nothing is deleted. The only thing that stops is adding the eleventh colony. If you subscribe, grow to fifteen colonies and then stop paying, you keep all fifteen, you can go on inspecting them, and you keep your whole history — you simply cannot add a sixteenth until the subscription runs again.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">What the subscription includes</h2>
        <ul className="help-list">
          <li>As many colonies as you keep.</li>
          <li>Inviting somebody to work with you on an apiary or on a single hive. The person who invites needs the subscription; a guest accepting an invitation does not.</li>
          <li>Your own fields on hives and inspections. An apiary's custom fields go by its owner's subscription, so everybody invited onto it can use them.</li>
          <li>The whole statistics history instead of the last year, and the regional health map under Members.</li>
        </ul>
        <p>Free either way, and meant to stay that way: the Asian hornet tracker, the beekeeping year, QR codes and scanning, inspections recorded without a signal, and the export of your own data. Statistics are narrowed rather than refused — a free account asking for the whole history gets one year, not an error message.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Subscribing</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">On the website, open <strong>Dashboard → Subscription</strong>. The page shows how many colonies you keep, what the subscription includes and whether anything is already running.</div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">Choose <strong>Subscribe</strong> and complete the payment. Access is unlocked as soon as the payment is confirmed — on the website and in both apps, because the account carries the subscription and not the device.</div>
          </li>
        </ol>
        <p>For now the subscription is bought on the website. In the iPhone and Android apps the purchase will go through the App Store and Google Play, as those stores require, and that is still being built. Whichever way you buy, the subscription belongs to your HivePulse account and works everywhere you sign in — the limit itself already applies on all three.</p>
        <Screenshot src="/docs/screenshots/subscription.png" caption="The subscription page: what you keep, what the subscription includes, and where to cancel" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Cancelling, and what happens afterwards</h2>
        <p>A subscription bought through the App Store or Google Play can only be cancelled there — in the iPhone's Settings under your name, or in Google Play under Payments &amp; subscriptions. The app and the website cannot cancel it, and the Subscription page says so and points you to the right place. A subscription bought on the website is cancelled through the link on that same page.</p>
        <p>Cancelling does not end it immediately: it runs to the end of the period you paid for, and the Subscription page shows that date. Afterwards the free limit applies again — and, as above, everything you have recorded stays exactly where it is.</p>
      </section>
    </>
  );
}
