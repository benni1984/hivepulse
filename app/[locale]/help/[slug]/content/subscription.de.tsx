import type HelpScreenshot from '@/components/HelpScreenshot';

export default function SubscriptionContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Was kostenlos ist</h2>
        <p>HivePulse ist bis zu 10 Völkern kostenlos, mit beliebig vielen Bienenständen. Zehn deckt den Imker mit ein paar Völkern hinterm Haus ab, den man nie um Geld bitten sollte.</p>
        <p>Darüber kostet ein Supporter-Abo 19,99 € im Jahr. Ein Jahr statt eines Monats, weil Imkerei saisonal ist: zwischen März und Oktober passiert fast alles, und ein Monatsabo lüde jeden Herbst zur Kündigung ein.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Was eine erreichte Grenze niemals tut</h2>
        <p><strong>Eine erreichte Grenze schließt nie, was schon da ist.</strong></p>
        <p>Nichts wird versteckt, nichts nur lesbar, nichts gelöscht. Es stoppt einzig das elfte Volk. Wer ein Abo abschließt, auf fünfzehn Völker wächst und dann aufhört zu zahlen, behält alle fünfzehn, kann sie weiter kontrollieren und behält seine ganze Historie — er kann nur kein sechzehntes anlegen, bis das Abo wieder läuft.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Was zum Abo gehört</h2>
        <ul className="help-list">
          <li>So viele Völker, wie du führst.</li>
          <li>Jemanden einladen, der mit dir an einem Bienenstand oder an einem einzelnen Volk arbeitet. Das Abo braucht, wer einlädt; ein Gast, der eine Einladung annimmt, braucht keines.</li>
          <li>Eigene Felder an Völkern und Kontrollen. Die eigenen Felder eines Bienenstands richten sich nach dem Abo seines Besitzers, damit alle, die darauf eingeladen sind, sie benutzen können.</li>
          <li>Die ganze Statistik-Historie statt des letzten Jahres, und die regionale Gesundheitskarte unter Mitglieder.</li>
        </ul>
        <p>So oder so kostenlos, und das soll so bleiben: der Tracker für die Asiatische Hornisse, das Imkerjahr, QR-Codes und Scannen, Kontrollen ohne Empfang und der Export der eigenen Daten. Auch die Statistik wird verkleinert statt verweigert — fragt ein kostenloses Konto nach der ganzen Historie, bekommt es ein Jahr und keine Fehlermeldung.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Abo abschließen</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">Öffne auf der Webseite <strong>Dashboard → Abo</strong>. Die Seite zeigt, wie viele Völker du führst, was zum Abo gehört und ob schon etwas läuft.</div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">Wähle <strong>Abo abschließen</strong> und bezahle. Sobald die Zahlung bestätigt ist, ist alles freigeschaltet — auf der Webseite und in beiden Apps, denn das Abo hängt am Konto und nicht am Gerät.</div>
          </li>
        </ol>
        <p>In der iPhone- und der Android-App kaufst du es unter <strong>Einstellungen → Unterstützer</strong>, oder über die Karte im Mitglieder-Tab. Der Kauf läuft über den App Store beziehungsweise Google Play, wie es diese Stores verlangen, und kostet dort dasselbe. Egal auf welchem Weg du kaufst: das Abo gehört zu deinem HivePulse-Konto und gilt überall, wo du dich anmeldest — kauf es am Handy, und die Webseite weiß es Sekunden später.</p>
        <p>Neues Handy, oder App neu installiert? <strong>Kauf wiederherstellen</strong>, unten auf derselben Seite, holt ein im Store gekauftes Abo zurück. Für ein auf der Webseite gekauftes brauchst du das nie — das folgt ohnehin dem Konto.</p>
        <Screenshot src="/docs/screenshots/subscription.png" caption="Die Abo-Seite: was du führst, was zum Abo gehört und wo man kündigt" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Kündigen — und was danach passiert</h2>
        <p>Ein über den App Store oder Google Play gekauftes Abo lässt sich nur dort kündigen — am iPhone in den Einstellungen unter deinem Namen, bei Google Play unter Zahlungen und Abos. Weder die App noch die Webseite können es kündigen; die Abo-Seite sagt das und nennt die richtige Stelle. Ein auf der Webseite gekauftes Abo kündigst du über den Link auf derselben Seite.</p>
        <p>Eine Kündigung beendet es nicht sofort: es läuft bis zum Ende des bezahlten Zeitraums, und die Abo-Seite zeigt dieses Datum. Danach gilt wieder die kostenlose Grenze — und wie oben gilt: alles, was du erfasst hast, bleibt genau da, wo es ist.</p>
      </section>
    </>
  );
}
