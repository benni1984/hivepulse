import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HomeAndTreatmentsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Dein Tag im Überblick</h2>
        <p>
          Der Anfang der Liste der Bienenstände (und des Dashboards auf der Webseite) zeigt dir, was beim Öffnen von
          HivePulse wichtig ist. Völker, die andere Imker mit dir geteilt haben, sind eingeschlossen. Tippe auf ein Volk,
          um es zu öffnen.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>
            <strong>Nächste Kontrolle.</strong> Ein Volk ist fällig, wenn dein Erinnerungs-Intervall seit der letzten
            Kontrolle vergangen ist (gerechnet ab dem Tag, den du eingetragen hast, nicht ab dem Tag der Eingabe). Du
            siehst, wie viele überfällig und wie viele in den nächsten drei Tagen fällig sind. Ein Volk ohne Kontrolle
            ist so viele Tage nach seiner Anlage fällig.
          </li>
          <li>
            <strong>Zustand der Völker.</strong> In Ordnung, beobachten, Alarm oder unbekannt, gelesen aus der letzten
            Kontrolle: <em>Alarm</em> bei hohem Varroabefall, Schwarmzellen oder aggressiver Stimmung; <em>beobachten</em>
            bei mittlerem Varroabefall, nervöser Stimmung oder wenn die Königin nicht gesehen wurde; <em>unbekannt</em> bei
            Völkern ohne Kontrolle. Völker, die Aufmerksamkeit brauchen, stehen mit dem Grund in der Liste.
          </li>
          <li>
            <strong>Anstehende Behandlungen.</strong> Was in den nächsten 30 Tagen geplant ist, Überfälliges zuerst, jeweils
            mit einem Knopf <em>Erledigt</em>.
          </li>
          <li>
            <strong>Eine Mitteilung.</strong> Ab und zu kann hier eine Karte von uns erscheinen. Sie besteht nur aus Text:
            kein Werbenetzwerk, kein Tracking.
          </li>
        </ul>
        <p>
          Intervall und Saison stellst du unter <em>Einstellungen &rarr; Kontrollerinnerungen</em> ein. Außerhalb der
          Saison werden die Termine genauso berechnet, und ein Hinweis sagt es dir.
        </p>
        <Screenshot android="/docs/screenshots/android-home-summary.png" web="/docs/screenshots/home-summary.png" caption="Die Startseite oben in der Liste der Bienenstände" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Eine Behandlung planen</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Volk oder Bienenstand öffnen</strong>
              <p>Auf der Volk-Seite <em>Behandlungen</em> wählen. Für alle Völker eines Bienenstands das Behandlungs-Symbol in der Leiste des Bienenstands verwenden.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Mittel, Tag und eine optionale Notiz</strong>
              <p>Zum Beispiel Oxalsäure an dem Tag, an dem du behandeln willst. <em>Behandlung planen</em> antippen.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Als erledigt markieren</strong>
              <p><em>Erledigt</em> auf der Startseite oder in der Liste. Eine versehentlich erledigte Behandlung lässt sich wieder öffnen; die letzten erledigten stehen darunter.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            Planen ist nicht Protokollieren. Was du tatsächlich angewendet hast, trägst du weiterhin in der Kontrolle ein
            (<em>angewendete Behandlung</em>). Wer einzelne Völker bekommen hat, kann für diese Völker planen, nicht für den
            ganzen Bienenstand.
          </p>
        </div>
        <Screenshot android="/docs/screenshots/android-treatments.png" web="/docs/screenshots/treatments-panel.png" caption="Eine Behandlung planen und abhaken" />
      </section>
    </>
  );
}
