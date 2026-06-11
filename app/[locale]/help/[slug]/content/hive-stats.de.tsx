import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HiveStatsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Was sind Volksstatistiken?</h2>
        <p>
          Volksstatistiken verwandeln Ihre Inspektionshistorie in Diagramme und Zusammenfassungszahlen, sodass Sie
          Trends erkennen können, die Sie beim Überprüfen einzelner Einträge übersehen würden. Statistiken sind auf dem Volk-
          Detailbildschirm auf allen Plattformen verfügbar.
        </p>
        <Screenshot caption="Volksstatistik-Seite mit dem Varroa-Trenddiagramm und der Stimmungsverteilung" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zeitraumfilter</h2>
        <p>
          Alle Diagramme und Zahlen können nach Zeitraum gefiltert werden: <strong>30 Tage</strong>, <strong>90 Tage</strong>,
          <strong>365 Tage</strong> oder <strong>Gesamte Zeit</strong>. Verwenden Sie kürzere Zeiträume, um sich auf eine aktuelle
          Saison zu konzentrieren; verwenden Sie Gesamte Zeit, um die vollständige Geschichte eines Volkes zu sehen.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Jede Statistik erklärt</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-chart-line" style={{ marginRight: 6, color: '#f59e0b' }} />Varroa-Zählungstrend</div>
            <div className="help-stat-card-desc">
              Ein Liniendiagramm Ihrer Varroazählungen im Zeitverlauf. Die x-Achse ist das Inspektionsdatum; die y-Achse
              sind Milben pro 100 Bienen. Achten Sie auf die Steigung: eine steigende Linie bedeutet, dass die Milbenlast wächst
              und bald eine Behandlung erforderlich sein könnte.
            </div>
            <span className="help-stat-card-good">Ziel: flache Linie nahe 0–2</span>{' '}
            <span className="help-stat-card-warn">Steigende Tendenz = dringend behandeln</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-face-smile" style={{ marginRight: 6, color: '#22c55e' }} />Stimmungsverteilung</div>
            <div className="help-stat-card-desc">
              Ein Donut-Diagramm, das den Anteil Ruhiger, Nervöser und Aggressiver Inspektionen zeigt.
              Anhaltende Nervosität oder Aggression kann auf Weisellosigkeit, Krankheit oder genetische Probleme hindeuten,
              die einen Umweiselung erfordern.
            </div>
            <span className="help-stat-card-good">Ziel: &gt;80% Ruhig</span>{' '}
            <span className="help-stat-card-warn">&gt;20% Aggressiv = untersuchen</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-crown" style={{ marginRight: 6, color: '#eab308' }} />Königinnensichtungsrate</div>
            <div className="help-stat-card-desc">
              Prozentsatz der Inspektionen, bei denen Sie die Königin visuell bestätigt haben. Eine dauerhaft niedrige
              Rate kann bedeuten, dass die Königin schwer zu finden ist (normal bei dunklen Königinnen) oder dass das Volk
              weisellos geworden ist.
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-egg" style={{ marginRight: 6, color: '#8b5cf6' }} />Brutwaben</div>
            <div className="help-stat-card-desc">
              Durchschnittliche Anzahl der pro Inspektion im ausgewählten Zeitraum aufgezeichneten Brutwaben.
              Verfolgt das Volkswachstum über die Saison — Sie erwarten einen Anstieg ab dem Frühling, einen Höhepunkt im
              Frühsommer und dann einen Rückgang zum Herbst hin.
            </div>
            <span className="help-stat-card-good">Hauptsaison: 6–9 Rähmchen</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-clock" style={{ marginRight: 6, color: '#64748b' }} />Schwarmzell-Ereignisse</div>
            <div className="help-stat-card-desc">
              Anzahl der Inspektionen, bei denen Schwarmzellen gemeldet wurden. Eine hohe Anzahl weist auf ein
              schwarmfreudiges Volk hin, das von Schwarmverhinderungsmaßnahmen profitieren könnte (Teilen, mehr Raum bieten).
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-calendar" style={{ marginRight: 6, color: '#0ea5e9' }} />Inspektionen pro Zeitraum</div>
            <div className="help-stat-card-desc">
              Gesamtanzahl der im ausgewählten Zeitraum protokollierten Inspektionen. Konsistente Inspektionshäufigkeit
              (alle 7–14 Tage in der Hauptsaison) liefert die zuverlässigsten Trenddaten.
            </div>
          </div>
        </div>

        <Screenshot caption="Varroa-Trendliniendiagramm mit Inspektionsdaten auf der x-Achse" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Den Varroa-Trend lesen — was zu tun ist</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Flache Linie nahe 0–1</div>
            <div className="help-stat-card-desc">Milbenlast ist unter Kontrolle. Regelmäßige Überwachung alle 3–4 Wochen fortsetzen.</div>
            <span className="help-stat-card-good">Keine Aktion erforderlich</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Langsam steigend (1–3)</div>
            <div className="help-stat-card-desc">Natürlicher saisonaler Anstieg. Häufiger überwachen (alle 2 Wochen) und Behandlung planen, bevor es weiter steigt.</div>
            <span className="help-stat-card-warn">Genau beobachten</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Über 3 oder steil steigend</div>
            <div className="help-stat-card-desc">Behandlungsschwelle erreicht. Sofort eine zugelassene Varroa-Behandlung anwenden. Unbehandelte Völker auf diesem Niveau kollabieren typischerweise vor dem Winter.</div>
            <span className="help-stat-card-warn">Sofort behandeln</span>
          </div>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Schwellenwerte variieren je nach Land, Jahreszeit und Methode. Befolgen Sie immer die Richtlinien Ihres nationalen Imkerverbands für Behandlungsschwellen.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tipps für bessere Statistiken</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Statistiken verbessern sich erheblich mit konsistenten Daten. Selbst wenn Sie bei jedem Besuch nur Varroazählung und Stimmung aufzeichnen, erhalten Sie nach vier oder fünf Inspektionen aussagekräftige Trendlinien.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Verwenden Sie jedes Mal dieselbe Probenahmemethode. Ein Wechsel zwischen Puderzucker- und Alkoholwaschung mitten in der Saison macht die Trendlinie schwerer zu interpretieren.</p>
        </div>
      </section>
    </>
  );
}
