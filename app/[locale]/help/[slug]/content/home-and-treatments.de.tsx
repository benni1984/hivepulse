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

      <section className="help-section">
        <h2 className="help-section-title">Das Bestandsbuch</h2>
        <p>Alle Behandlungen eines Bienenstands in einem Jahr, als Dokument zum Ausdrucken und Aufbewahren. Es entsteht aus dem, was du ohnehin erfasst hast — Arzneimittel, Menge, Anzahl der Völker, geplantes und tatsächliches Datum, wer es eingetragen hat — zusammen mit den Varroa-Befunden des Jahres, die der Grund sind, warum behandelt wurde.</p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body"><strong>Trage die Menge ein, während du behandelst.</strong> Die Menge ist das Feld, das das Bestandsbuch ausdrücklich verlangt. Es ist ein Textfeld — schreib es so, wie das Mittel angewendet wird: <em>2 × 15 ml je Volk</em>, <em>60 g</em>, <em>ein Streifen je 5 Waben</em>.</div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body"><strong>Öffne den Bienenstand und wähle <em>Bestandsbuch erstellen</em></strong>, mit dem Jahr, das du brauchst. Auf der Webseite steht das auf der Bienenstand-Seite, in den Apps unten im Behandlungs-Bildschirm des Bienenstands. Auch ein Jahr ohne Behandlungen ergibt ein Dokument — „hier wurde nicht behandelt“ ist ebenfalls eine Auskunft.</div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p><strong>Die Anzahl der Völker wird an dem Tag eingefroren, an dem du eine Behandlung als erledigt markierst.</strong> Behandelst du im August zehn Völker und gibst im Oktober drei ab, steht im Bestandsbuch weiterhin zehn — denn zehn hast du behandelt. Deshalb ist das Abhaken wichtiger, als es aussieht.</p>
        </div>
        <p>Das Bestandsbuch über Tierarzneimittel ist für Lebensmittel liefernde Tiere vorgeschrieben, und Bienen gehören dazu. Bewahre das ausgedruckte Dokument fünf Jahre auf und lege es auf Verlangen vor. HivePulse erstellt das Dokument; es behauptet nicht, selbst das Bestandsbuch zu sein.</p>
      </section>
    </>
  );
}
