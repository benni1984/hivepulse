import type HelpScreenshot from '@/components/HelpScreenshot';

export default function SharingContent(_: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Gemeinsam an einem Bienenstand arbeiten</h2>
        <p>
          Zwei Imker können denselben Bienenstand oder einzelne Völker gemeinsam betreuen. Du lädst die andere Person
          per E-Mail-Adresse ein; sobald sie annimmt, seht ihr beide dieselben Völker und Kontrollen, und ihr könnt beide
          Kontrollen erfassen, Völker bearbeiten und Völker hinzufügen.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            <strong>Was beim Besitzer bleibt.</strong> Wer den Bienenstand angelegt hat, ist sein Besitzer. Nur der
            Besitzer kann einen Bienenstand oder ein Volk löschen, einen Bienenstand auf der Community-Karte öffentlich
            machen, Völker verlagern und Personen einladen oder entfernen. Ein Mitarbeiter kann jederzeit selbst
            aussteigen.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Den ganzen Bienenstand oder einzelne Völker teilen</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Ein Bienenstand</strong> teilt den Bienenstand und jedes Volk darin, auch Völker, die du später hinzufügst.</li>
          <li>
            <strong>Ein einzelnes Volk</strong> teilt nur dieses Volk. Die andere Person sieht den Namen seines
            Bienenstands, um sich zurechtzufinden, aber keines der übrigen Völker, und sie kann den Bienenstand weder
            bearbeiten noch Völker hinzufügen.
          </li>
        </ul>
        <p>Um einige Völker eines Bienenstands zu teilen, andere nicht, lege sie in einem eigenen Bienenstand an und teile diesen.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Jemanden einladen</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Bienenstand oder Volk öffnen</strong>
              <p>Auf der Webseite <em>Zusammenarbeiten</em> auf der Seite; in den Apps das Personen-Symbol in der Leiste oben antippen.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>E-Mail-Adresse eingeben und senden</strong>
              <p>Die Einladung bleibt <em>ausstehend</em>, bis sie angenommen wird. Du kannst sie auf demselben Bildschirm zurückziehen.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Eine Einladung annehmen</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>
            <strong>Du hast schon ein Konto</strong> mit dieser Adresse: Die Einladung erscheint ganz oben in deiner Liste
            der Bienenstände mit <em>Annehmen</em> und <em>Ablehnen</em>. Eine E-Mail informiert dich ebenfalls.
          </li>
          <li>
            <strong>Du hast noch kein Konto:</strong> Die E-Mail enthält einen Link. Öffne ihn, registriere dich oder melde
            dich mit dieser Adresse an und nimm an. In den Apps tippst du in der Liste der Bienenstände oben auf das
            Umschlag-Symbol (<em>Einladungslink einlösen</em>) und fügst den Link ein.
          </li>
        </ul>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Das Teilen beenden</h2>
        <p>
          Der Besitzer entfernt eine Person auf demselben Bildschirm <em>Zusammenarbeiten</em>; der Bienenstand oder das
          Volk verschwindet sofort aus der Liste der anderen Person. Ein Mitarbeiter kann von seiner Seite aussteigen.
          Kontrollen, die du erfasst hast, bleiben am Volk.
        </p>
      </section>
    </>
  );
}
