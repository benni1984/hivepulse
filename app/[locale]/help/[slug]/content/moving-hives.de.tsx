import type HelpScreenshot from '@/components/HelpScreenshot';

export default function MovingHivesContent(_: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Völker zur Blüte bringen</h2>
        <p>
          Wanderimker bringen ihre Völker dorthin, wo etwas blüht: Akazie, Raps, Tanne, Heide. Das Verlagern ist ein
          einziger Schritt: Du wählst die Völker, den neuen Ort, den Tag und die Tracht. Jede Verlagerung bleibt
          gespeichert, du siehst also immer, wo ein Volk wann gestanden hat.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Völker verlagern</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Den Bienenstand öffnen, an dem die Völker stehen</strong>
              <p><em>Völker verlagern</em> antippen (die beiden Pfeile in der Leiste oben; auf der Webseite die Schaltfläche auf der Seite des Bienenstands).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Völker wählen</strong>
              <p>Einzelne Völker oder alle mit <em>Alle Völker</em>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Ziel wählen</strong>
              <p>
                Einer deiner anderen Bienenstände oder <em>Ein neuer Ort</em> mit Name und Adresse. HivePulse schlägt die
                Adresse nach, damit der Ort auf der Karte eingezeichnet werden kann.
              </p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Tag, Tracht und Notiz</strong>
              <p>Der Tag ist heute, wenn du ihn nicht änderst (nicht in der Zukunft). Wähle eine Tracht oder schreibe eine eigene und füge bei Bedarf eine Notiz hinzu.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            <strong>Zurück, wo sie herkamen.</strong> Waren Völker schon einmal an diesen Bienenstand gebracht worden,
            erscheinen oben im Formular Knöpfe wie &bdquo;Zurück nach Feld (3)&ldquo;. Ein Tipp wählt diese Völker und ihren
            früheren Ort; du bestätigst nur noch den Tag.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Wo ein Volk gestanden hat</h2>
        <p>
          Jede Volk-Seite zeigt <em>Wo dieses Volk gestanden hat</em>: seinen Weg auf einer Karte und die Liste seiner
          Verlagerungen. Die <em>Wanderkarte</em> (das Karten-Symbol in der Leiste der Bienenstände, auf der Webseite im
          Menü des Dashboards) zeichnet den Weg jedes Volks, Station für Station nummeriert, und lässt sich auf einen
          Zeitraum eingrenzen.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Gut zu wissen</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Nur der Besitzer eines Bienenstands kann dessen Völker verlagern.</li>
          <li>Ein Volk behält beim Verlagern seinen QR-Code und alle Kontrollen.</li>
          <li>Ein leerer Bienenstand bleibt bestehen; er wartet auf die nächste Saison.</li>
          <li>Innerhalb desselben Bienenstands zu verlagern ist nicht möglich, da gibt es nichts zu verlagern.</li>
          <li>Für die Karte brauchen beide Orte Koordinaten oder eine Adresse.</li>
        </ul>
      </section>
    </>
  );
}
