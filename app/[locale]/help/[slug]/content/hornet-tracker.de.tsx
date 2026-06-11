import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HornetTrackerContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Warum Asiatische Hornissen verfolgen?</h2>
        <p>
          <em>Vespa velutina</em> (die Asiatische Hornisse) ist ein invasiver Räuber, der Honigbienen
          an Beuten-Eingängen jagt und dabei Sammeltätigkeit und Volksstärke drastisch reduziert. Frühzeitige Erkennung und
          Nest-Zerstörung sind die wirksamsten Bekämpfungsmaßnahmen. HivePulse's Hornet Tracker
          ermöglicht es jedem Bürger — kein Konto erforderlich — Sichtungen beizutragen, und lässt Imker
          die Nestdichte in ihrer Region überwachen.
        </p>
        <Screenshot src="/docs/screenshots/android-hornet-home.png" caption="Hornet Tracker-Startseite mit aggregierten Statistiken und Aktionslinks" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Einen Fang melden</h2>
        <p>
          Ein „Fang" ist die Anzahl der in einer Falle über einen Zeitraum gefangenen Hornissen.
          Meldungen erfordern kein Konto.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Zu Hornissen → Melden gehen</strong>
              <p>Navigieren Sie im Web zu <strong>/hornets/report</strong>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Fangzahl und optionalen Standort eingeben</strong>
              <p>Das Hinzufügen von GPS-Koordinaten platziert Ihren Fang auf der Karte und hilft Behörden, Ausbreitungsmuster zu verfolgen.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Absenden</strong>
              <p>Ihre Meldung wird sofort zur Community-Fanggesamtzahl hinzugefügt.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-hornet-report.png" caption="Fangmeldeformular mit Zähleingabe und optionalen GPS-Feldern" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Ein Nest melden</h2>
        <p>
          Nestmeldungen enthalten einen GPS-Standort und aktuellen Status (Gefunden / Zerstörung angeordnet / Zerstört).
          Bestätigte Nester erscheinen als rote Nadeln auf der Hornissen-Karte.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Zu Hornissen → Melden gehen</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Zum Nest-Tab wechseln</strong>
              <p>Breitengrad, Längengrad und Neststatus eingeben.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Absenden</strong>
              <p>Das Nest erscheint auf der Karte für andere Imker und lokale Behörden.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Foto-Sichtungen &amp; Community-Abstimmung</h2>
        <p>
          Der Community-Sichtungs-Feed ermöglicht es Benutzern, ein Foto einer vermuteten Asiatischen Hornisse
          zur Überprüfung durch andere einzureichen. Fehlidentifizierungen sind häufig (Asiatische Hornissen werden oft
          mit Europäischen Hornissen und Schwebfliegen verwechselt), daher hilft Community-Abstimmung, genaue Meldungen zu filtern.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Zu Hornissen → Community-Sichtungen gehen</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Feed durchsuchen</strong>
              <p>Jede Karte zeigt das Foto, das Einreichungsdatum und die aktuelle Ja/Nein-Stimmenzahl.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Ja oder Nein abstimmen</strong>
              <p>Geben Sie eine Stimme pro Sichtung ab. Admins können den Status auf Bestätigt oder Abgelehnt ändern.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Eigenes Foto einreichen</strong>
              <p>Tippen Sie auf die +-Schaltfläche, laden Sie ein Foto hoch und fügen Sie optionale Standortdaten hinzu.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-hornet-community.png" caption="Community-Sichtungs-Feed mit Foto-Karten und Stimmenzahlen" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Statistiken lesen</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Gesamt gefangen</div>
            <div className="help-stat-card-desc">Alle Hornissen, die plattformweit als gefangen gemeldet wurden. Eine steigende Gesamtzahl signalisiert eine aktive Saison.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Nester gefunden</div>
            <div className="help-stat-card-desc">Anzahl der eingereichten Nestmeldungen. Hohe Nestzahlen in Ihrer Region bedeuten ein höheres Räuberrisiko an Ihrem Bienenstand.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Nester zerstört</div>
            <div className="help-stat-card-desc">Nester mit Status „Zerstört". Verfolgt die Effektivität lokaler Bekämpfungsmaßnahmen.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Ausstehende Sichtungen</div>
            <div className="help-stat-card-desc">Community-Foto-Sichtungen, die auf genügend Stimmen warten, um bestätigt oder abgelehnt zu werden. Helfen Sie, diese Zahl zu reduzieren, indem Sie über offene Sichtungen abstimmen.</div>
          </div>
        </div>
      </section>
    </>
  );
}
