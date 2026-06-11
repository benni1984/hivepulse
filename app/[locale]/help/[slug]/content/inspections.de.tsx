import type HelpScreenshot from '@/components/HelpScreenshot';

export default function InspectionsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Was ist eine Inspektion?</h2>
        <p>
          Eine Inspektion ist ein einzelner Besuch an einem Volk. Jedes Mal, wenn Sie einen Bienenstock öffnen, erfassen Sie
          Ihre Beobachtungen als Inspektionseintrag: Gesundheitsindikatoren, Populationsdaten, Königinnenstatus
          sowie durchgeführte Behandlungen oder Fütterungen. Im Laufe der Zeit zeichnen diese Einträge ein Bild der
          Völkergesundheit, das Diagramme und Trendanalysen sichtbar machen können.
        </p>
        <Screenshot src="/docs/screenshots/android-inspection-form.png" caption="Geöffnetes Inspektionsformular für ein Volk mit allen Abschnitten" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Inspektion protokollieren</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Volk öffnen</strong>
              <p>Navigieren Sie zur Volk-Detailansicht — über die Bienenstandliste oder durch Scannen des QR-Codes auf dem Stock.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Auf Neue Inspektion tippen</strong>
              <p>Das Inspektionsformular öffnet sich. Das Datum ist standardmäßig heute, kann aber geändert werden (für nachträgliche Einträge).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Beobachtungen eintragen</strong>
              <p>Nur das Datum ist erforderlich. Alle anderen Felder sind optional — notieren Sie, was Sie geprüft haben, und lassen Sie den Rest weg.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Speichern</strong>
              <p>Die Inspektion wird sofort zur Volkhistorie hinzugefügt und fließt in die Trenddiagramme ein.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-inspection-form-bottom.png" caption="Inspektion speichern — Datum- und Varroazähl-Felder sind sichtbar" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Alle Inspektionsfelder erklärt</h2>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Völkergesundheit</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Varroazählung</div>
            <div className="help-stat-card-desc">
              Anzahl der gefundenen Varroa-destructor-Milben in einer Probenwaschung (Puderzucker- oder Alkoholwaschung von ~100 Bienen).
              Dies ist der wichtigste Gesundheitsindikator — hohe Milbenlasten verkürzen die Lebenserwartung der Arbeitsbienen, schwächen das Volk und übertragen Viren.
            </div>
            <span className="help-stat-card-good">Gut: 0–2 Milben pro 100</span>{' '}
            <span className="help-stat-card-warn">Handeln: 3+ Milben pro 100</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Volksstimmung</div>
            <div className="help-stat-card-desc">
              Wie sich die Bienen während der Inspektion verhielten.
              <br /><strong>Ruhig</strong> — Bienen waren sanft, bewegten sich langsam, wenige Stiche.<br />
              <strong>Nervös</strong> — Bienen waren aufgeregt, schwer zu handhaben.<br />
              <strong>Aggressiv</strong> — Bienen griffen aktiv an, mehrere Stiche.
            </div>
            <span className="help-stat-card-good">Ziel: überwiegend Ruhig</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Königin gesehen</div>
            <div className="help-stat-card-desc">
              Aktivieren Sie dies, wenn Sie die Königin während der Inspektion visuell bestätigt haben.
              Wenn Sie frische Eier, aber nicht die Königin selbst sehen, lassen Sie es deaktiviert — Eier sind nur indirekter Hinweis.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Königinnenfarbe</div>
            <div className="help-stat-card-desc">
              Internationale SICAMM-Farbkodierung nach Jahr. Weiß (Jahre die auf 1/6 enden), Gelb (2/7),
              Rot (3/8), Grün (4/9), Blau (5/0). Hilft Ihnen, das Alter der Königin zu verfolgen.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Schwarmzellen gesehen</div>
            <div className="help-stat-card-desc">
              Aktivieren Sie dies, wenn Sie Königinnenzellen für den Schwarm entdeckt haben. Dies ist eine Frühwarnung,
              dass das Volk innerhalb von Tagen schwärmen könnte.
            </div>
            <span className="help-stat-card-warn">Aktion erforderlich, wenn aktiviert</span>
          </div>
        </div>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: '24px 0 12px', color: 'var(--text-primary)' }}>Population</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Brutwaben</div>
            <div className="help-stat-card-desc">
              Anzahl der Waben mit Brut (Eier, Larven oder verdeckelte Zellen). Dies misst das Wachstumspotenzial des Volkes.
              Ein starkes, gesundes Volk in der Hauptsaison füllt typischerweise 7–9 Rähmchen in einem Standard-Langstroth.
            </div>
            <span className="help-stat-card-good">Gut (Frühling/Sommer): 6–9 Rähmchen</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Honigwaben</div>
            <div className="help-stat-card-desc">
              Anzahl der Waben mit eingelagertem Honig. Wichtig für die Überwachung der Wintervorräte.
              Ein Volk benötigt etwa 15–20 kg Honig, um einen kalten Winter zu überleben.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Volksstärke</div>
            <div className="help-stat-card-desc">
              Subjektive 1–5-Skala für die Gesamtstärke des Volkes. Nützlich, wenn Sie die relative
              Population verfolgen möchten, ohne einzelne Rähmchen zu zählen.
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: '24px 0 12px', color: 'var(--text-primary)' }}>Gewicht &amp; Behandlung</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Gewicht (kg)</div>
            <div className="help-stat-card-desc">
              Gesamtgewicht des Bienenstocks von einer Bienenwaage. Das Gewicht über Zeit zu verfolgen zeigt
              Trachtflüsse und Verbrauch der Wintervorräte, ohne den Stock zu öffnen.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Durchgeführte Behandlung</div>
            <div className="help-stat-card-desc">
              Freitextfeld zur Notiz einer Varroa-Behandlung, eines Antibiotikums oder anderer verwendeter Medikamente.
              Das Führen von Behandlungsaufzeichnungen ist in vielen Ländern gesetzlich vorgeschrieben.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Fütterung erfolgt</div>
            <div className="help-stat-card-desc">
              Kontrollkästchen zur Aufzeichnung, dass Sie das Volk gefüttert haben. Verwenden Sie das Notizfeld, um Art und Menge anzugeben.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Fütterungsart</div>
            <div className="help-stat-card-desc">
              Was Sie gefüttert haben: Zuckersirup, Fondant, Pollenersatz usw.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tipps</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Notieren Sie Varroazählungen konsequent mit derselben Methode (Puderzucker- oder Alkoholwaschung), damit das Trenddiagramm über alle Inspektionen hinweg vergleichbar ist.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Auch eine Teilinspektion (nur Stimmung und Brutwaben) ist wertvoll. Konsistente Teileinträge sind besser als perfekte Einträge, die nur einmal im Jahr erfolgen.</p>
        </div>
      </section>
    </>
  );
}
