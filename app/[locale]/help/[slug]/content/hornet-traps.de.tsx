import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HornetTrapsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Was ist eine benannte Falle?</h2>
        <p>
          Eine benannte Falle ist eine physische Asiatische-Hornissen-Falle, die in HivePulse registriert wurde.
          Jede Falle erhält einen <strong>8-stelligen Zugangscode</strong>. Jeder, der den Code kennt —
          Sie, ein Nachbar, ein Freiwilliger, ein Feldforscher — kann tägliche Fangzahlen für diese
          Falle protokollieren, ohne ein HivePulse-Konto zu benötigen.
        </p>
        <p>
          Benannte Fallen erleichtern den Betrieb verteilter Überwachungsnetze: Registrieren Sie Fallen an
          mehreren Standorten, teilen Sie die Zugangscodes mit lokalen Imkervereinen und
          sammeln Sie Fangdaten aus der Community.
        </p>
        <Screenshot src="/docs/screenshots/android-hornet-traps.png" caption="Fallen-Detailbildschirm mit Zugangscode, Fanghistorie und Fang-protokollieren-Schaltfläche" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Falle registrieren</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Zu Hornissen → Fallen gehen</strong>
              <p>Navigieren Sie im Web zu <strong>/hornets/traps</strong> oder öffnen Sie den Hornissen-Fallen-Bildschirm auf dem Mobilgerät.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Auf Neue Falle registrieren tippen</strong>
              <p>Geben Sie einen Namen (z. B. „Nordzaun"), GPS-Koordinaten und eine optionale Beschreibung ein.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Speichern</strong>
              <p>Ihre Falle wird registriert und ein 8-stelliger Zugangscode wird generiert. Notieren Sie ihn oder teilen Sie ihn.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-hornet-traps.png" caption="Fallen-Registrierungsformular mit Name, GPS und generiertem Zugangscode" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tagesfang protokollieren</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Zugangscode eingeben</strong>
              <p>Geben Sie auf der Fallen-Seite den 8-stelligen Code in das Suchfeld ein. Die Falle öffnet sich ohne Anmeldung.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Auf Heutigen Fang protokollieren tippen</strong>
              <p>Geben Sie die Anzahl der seit dem letzten Kontrollgang gefangenen Hornissen ein.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Speichern</strong>
              <p>Pro Falle und Tag wird nur ein Fang gespeichert — ein erneutes Einreichen heute aktualisiert den bestehenden Eintrag.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Fallen in Ihrer Nähe finden</h2>
        <p>
          Der Tab <strong>In der Nähe</strong> auf der Fallen-Seite zeigt registrierte Fallen innerhalb von 50 Metern
          von Ihrem aktuellen GPS-Standort. Dies ist nützlich, wenn Sie sich im Feld befinden und einen Fang für
          eine verwaltete Falle protokollieren möchten, aber den Zugangscode nicht mehr wissen.
        </p>
        <Screenshot src="/docs/screenshots/android-hornet-traps.png" caption="Liste nahegelegener Fallen mit zwei Fallen innerhalb von 50 m und Entfernungsangaben" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Fallenkarte</h2>
        <p>
          Alle registrierten Fallen erscheinen als blaue Nadeln auf der Hornissen-Karte unter <strong>/hornets/map</strong>.
          Dies gibt lokalen Imkervereinen einen Überblick über Abdeckungslücken — Gebiete ohne Falle
          und hoher Nestdichte, die von einer neuen Fallenplatzierung profitieren würden.
        </p>
      </section>
    </>
  );
}
