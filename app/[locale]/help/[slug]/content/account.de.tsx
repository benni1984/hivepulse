import type HelpScreenshot from '@/components/HelpScreenshot';

export default function AccountContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Profil bearbeiten</h2>
        <p>
          Ihr Profil speichert Ihren Anzeigenamen und Ihre bevorzugte Sprache. Der Anzeigename
          erscheint im Admin-Panel, wenn Ihr Konto über Admin-Rechte verfügt. Die Spracheinstellung
          bestimmt, welche Locale die mobilen Apps für UI-Beschriftungen verwenden.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Web:</strong> Gehen Sie zu <strong>Dashboard → Profil</strong> (<code>/dashboard/profile</code>).
              <strong> Mobil:</strong> Öffnen Sie den Einstellungs-Tab.
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Anzeigenamen bearbeiten</strong>
              <p>Geben Sie den neuen Namen ein und tippen Sie auf Profil speichern / Speichern.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Sprache ändern</strong>
              <p>Wählen Sie Englisch, Französisch, Deutsch oder Spanisch aus der Sprachauswahl.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-settings-account.png" caption="Profilabschnitt in den Einstellungen mit dem Anzeigenamenfeld und der Sprachauswahl" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Passwort ändern</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abschnitt Passwort ändern öffnen</strong>
              <p>Im Web: Dashboard → Profil. Auf dem Mobilgerät: Einstellungen → nach unten scrollen zu Passwort ändern.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Aktuelles Passwort eingeben</strong>
              <p>Dies bestätigt, dass Sie der Kontoinhaber sind.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Neues Passwort eingeben und bestätigen</strong>
              <p>Mindestens 8 Zeichen.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Auf Passwort ändern tippen</strong>
              <p>Sie bleiben angemeldet. Alle anderen aktiven Sitzungen bleiben gültig.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Aktuelles Passwort vergessen? Verwenden Sie den Link <strong>Passwort vergessen</strong> auf dem Anmeldebildschirm, um einen Reset-Link per E-Mail zu erhalten.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Konto löschen</h2>
        <p>
          Das Löschen Ihres Kontos entfernt dauerhaft Ihre E-Mail-Adresse, den Anzeigenamen, alle Bienenstände,
          alle Völker und alle Inspektionseinträge. Diese Aktion <strong>kann nicht rückgängig gemacht werden</strong>.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Zuerst Daten exportieren</strong>
              <p>Laden Sie einen JSON- oder CSV-Export jedes Bienenstands herunter, wenn Sie Ihre Einträge behalten möchten.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Gefahrenzone öffnen</strong>
              <p>Im Web: Dashboard → Profil → Gefahrenzone. Auf dem Mobilgerät: Einstellungen → nach unten scrollen.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Auf Konto löschen tippen und bestätigen</strong>
              <p>Ein Bestätigungsdialog erklärt, was gelöscht wird. Bestätigen Sie, um fortzufahren.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Ihre Inspektionsdaten haben möglicherweise zur Community-Statistik beigetragen. Das Löschen Ihres Kontos entfernt Ihre Daten aus zukünftigen Community-Aggregaten, aber bereits berechnete historische Statistiken werden nicht rückwirkend neu berechnet.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Abmelden</h2>
        <p>
          Tippen Sie auf <strong>Abmelden</strong> in den Einstellungen (Mobil) oder im Dropdown oben rechts (Web).
          Ihr Sitzungs-Token wird serverseitig widerrufen. Sie werden zum Anmeldebildschirm weitergeleitet.
          Ihre Daten bleiben erhalten — das Abmelden löscht nichts.
        </p>
      </section>
    </>
  );
}
