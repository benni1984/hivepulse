import type HelpScreenshot from '@/components/HelpScreenshot';

export default function BeekeepingYearContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Was der Zeitstrahl zeigt</h2>
        <p>
          Das Imkerjahr ist ein Zeitstrahl dessen, was ein Imker wann tut, Monat für Monat: im Februar mit Futterteig
          füttern, die ersten Kontrollen, Schwarmkontrolle jede Woche und spätestens alle 9 Tage, Drohnenrahmen gegen
          Varroa, wann für welchen Honig zu verlagern und wann er zu schleudern ist, und die Vorbereitung auf den Winter
          mit Varroabehandlung und Fütterung.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Er ist endlos: Nach oben und unten scrollen, das Jahr wiederholt sich.</li>
          <li>Er öffnet sich bei heute. Was gerade läuft, ist mit <em>Jetzt</em> markiert, und eine Linie zeigt, wo heute liegt.</li>
          <li>Eine Aufgabe, die sich wiederholt, sagt wie oft, zum Beispiel <em>Spätestens alle 9 Tage</em> bei der Schwarmkontrolle.</li>
          <li>Eine Aufgabe zu einer Honigsorte zeigt sie an, zum Beispiel Raps oder Akazie.</li>
        </ul>
        <p>
          Du findest ihn im Menü des Dashboards auf der Webseite (<em>Imkerjahr</em>) und in der Leiste der Liste der
          Bienenstände in beiden Apps (das Kalender-Symbol).
        </p>
        <Screenshot android="/docs/screenshots/android-beekeeping-year.png" web="/docs/screenshots/beekeeping-year.png" caption="Das Imkerjahr, bei heute geöffnet" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Die Region festlegen</h2>
        <p>
          Die Termine sind für Mitteldeutschland geschrieben. Die Natur ist im Süden früher und im Norden später dran;
          deshalb sagst du HivePulse, wo du deine Bienen hast, und die Termine verschieben sich: etwa vier Tage je
          Breitengrad, ein Volk bei Hamburg blüht also etwa zwei Wochen später als eines bei Frankfurt.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Die Region öffnen</strong>
              <p>Auf der Webseite: <em>Profil</em>, Karte <em>Region für das Imkerjahr</em>. In den Apps: <em>Einstellungen &rarr; Region</em> oder <em>Region festlegen</em> auf dem Zeitstrahl.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Land wählen und Postleitzahl eingeben</strong>
              <p>HivePulse schlägt die Postleitzahl einmal nach und behält nur die Position, nicht die Adresse.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Auf Wunsch von Hand anpassen</strong>
              <p>Ein Bergtal ist später, ein geschützter Garten früher. Du kannst bis zu 28 Tage dazugeben oder abziehen.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            Ohne Region nutzt der Zeitstrahl die Position deines ersten Bienenstands, und ohne die die Termine für
            Mitteldeutschland. Eine Zeile über dem Zeitstrahl sagt, welche, und um wie viele Tage sie die Termine verschiebt.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Honig: wann verlagern, wann schleudern</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Raps:</strong> zu Blühbeginn wandern, nach dem Ende der Blüte sofort schleudern (er wird in wenigen Tagen fest).</li>
          <li><strong>Akazie:</strong> eine Blüte von etwa zehn Tagen, also genau dann wandern; der Honig bleibt lange flüssig.</li>
          <li><strong>Linde:</strong> ab Ende Juni; schleudern, wenn zwei Drittel verdeckelt sind und das Wasser höchstens 18 % beträgt.</li>
          <li><strong>Tanne und Fichte (Honigtau):</strong> nur wandern, wenn die Tracht bestätigt ist; warm und rechtzeitig schleudern, bevor er in der Wabe erstarrt.</li>
          <li><strong>Edelkastanie, Lavendel, Sonnenblume:</strong> im Süden und in warmen Sommern; Sonnenblume kristallisiert sehr schnell.</li>
          <li><strong>Heide:</strong> ab August; der Honig ist gelartig und wird gepresst, nicht geschleudert.</li>
        </ul>
        <p>
          Ein Honig ist reif, wenn die Waben zu etwa zwei Dritteln verdeckelt sind (Schüttelprobe: nichts spritzt heraus)
          und der Wassergehalt höchstens 18 % beträgt, gemessen mit einem Refraktometer.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Gut zu wissen</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Die Termine sind Richtwerte aus der üblichen imkerlichen Praxis, keine Vorschriften: Blüte und Wetter entscheiden.</li>
          <li>Arzneimittel nur wie in deinem Land zugelassen und vorgeschrieben; im Zweifel frag deinen Imkerverband oder das Veterinäramt.</li>
          <li>Der Verdacht auf Faulbrut muss dem Veterinäramt gemeldet werden.</li>
          <li>Die Texte sind in der Sprache der App: Englisch, Deutsch, Französisch, Spanisch und Polnisch.</li>
        </ul>
      </section>
    </>
  );
}
