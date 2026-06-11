import type HelpScreenshot from '@/components/HelpScreenshot';

export default function GettingStartedContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Was ist HivePulse?</h2>
        <p>
          HivePulse ist eine Imkerei-Inspektions- und Community-Plattform für iOS, Android und das Web.
          Sie können jeden Bienenstockbesuch dokumentieren — Varroazählung, Volksstimmung, Königinnensichtungen,
          Brutwaben und mehr — und diese Daten in Diagramme und Trendanalysen über Zeit umwandeln.
        </p>
        <p>
          Jede Inspektion, die Sie aufzeichnen, trägt (anonym) zur plattformweiten Statistik bei,
          die der breiteren Imker-Gemeinschaft hilft, regionale Trends zur Völkergesundheit zu verstehen.
        </p>
        <Screenshot caption="HivePulse-Dashboard mit Übersicht des Bienenstands und Völkerliste" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Die drei Apps</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-globe" style={{ marginRight: 6 }} />Web-Dashboard</div>
            <div className="help-stat-card-desc">
              Vollständiges Dashboard unter <strong>apiscan-two.vercel.app</strong>. Am besten für die Verwaltung von Bienenständen,
              detaillierte Diagramme, QR-Chargen und Datenexport. Funktioniert in jedem Browser.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fab fa-apple" style={{ marginRight: 6 }} />iOS-App</div>
            <div className="help-stat-card-desc">
              Native iPhone-App für den Feldeinsatz optimiert. Scannen Sie den QR-Code auf einem Bienenstock,
              um ihn sofort zu öffnen, eine Inspektion zu protokollieren und Völkerstatistiken anzuzeigen — ohne Browser.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fab fa-android" style={{ marginRight: 6 }} />Android-App</div>
            <div className="help-stat-card-desc">
              Native Android-App mit demselben feldorientierten Design. Unterstützt QR-Scannen über die Kamera
              und funktioniert auf Geräten mit Android 8 (API 26) und höher.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Konto erstellen</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Registrierungsseite öffnen</strong>
              <p>Gehen Sie im Web zu <strong>/dashboard/register</strong> oder tippen Sie in der mobilen App auf <em>Konto erstellen</em>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Daten eingeben</strong>
              <p>Geben Sie eine E-Mail-Adresse, einen Anzeigenamen, Ihre bevorzugte Sprache (Englisch, Französisch, Deutsch oder Spanisch) und ein Passwort mit mindestens 8 Zeichen ein.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Bienenstände hinzufügen</strong>
              <p>Nach der Registrierung gelangen Sie zur Bienenstandliste. Tippen Sie auf die Schaltfläche <strong>+</strong>, um Ihren ersten Bienenstand zu erstellen.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Registrierungsformular im Web-Dashboard" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Empfohlene erste Schritte</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Bienenstand erstellen</strong>
              <p>Geben Sie ihm einen Namen und optional eine GPS-Position, damit er auf der Community-Karte erscheint.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Völker hinzufügen</strong>
              <p>Erstellen Sie einen Eintrag pro physischem Bienenstock. Wählen Sie den Bienenstock-Typ, der zu Ihrer Ausrüstung passt.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>QR-Codes generieren und drucken</strong>
              <p>Generieren Sie im Web eine QR-Charge und drucken Sie das PDF. Befestigen Sie ein Etikett an jedem Bienenstock.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Erste Inspektion protokollieren</strong>
              <p>Scannen Sie den QR-Code mit Ihrem Handy, tippen Sie auf <em>Neue Inspektion</em> und tragen Sie Ihre Beobachtungen ein.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Protokollieren Sie Inspektionen regelmäßig — auch wenn Sie nur die Varroazählung notieren — und HivePulse erstellt nach einigen Besuchen aussagekräftige Trenddiagramme.</p>
        </div>
      </section>
    </>
  );
}
