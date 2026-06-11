import type HelpScreenshot from '@/components/HelpScreenshot';

export default function CommunityStatsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Was sind Community-Statistiken?</h2>
        <p>
          Community-Statistiken zeigen plattformweite Aggregatzahlen, die aus allen öffentlichen Bienenständen
          auf HivePulse berechnet werden. Sie ermöglichen es Ihnen, Ihre Volksleistung mit Imkern in der
          breiteren Community zu vergleichen, ohne die individuellen Daten anderer preiszugeben.
        </p>
        <p>
          Der Community-Statistikbildschirm ist unter <strong>Mitglieder</strong> auf allen Plattformen verfügbar.
          Die vier Live-Statistik-Karten sind für alle sichtbar; die detaillierte Aufschlüsselung ist eine
          <strong> Supporter-Funktion</strong>.
        </p>
        <Screenshot caption="Mitgliederbildschirm mit den vier Community-Statistik-Karten" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Die vier Community-Statistiken erklärt</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Durchschn. Varroazählung</div>
            <div className="help-stat-card-desc">
              Die durchschnittliche Varroazählung (Milben pro 100 Bienen) über alle öffentlichen Inspektionen, bei denen
              eine Varroamessung aufgezeichnet wurde. Gibt Ihnen einen regionalen Vergleichswert: Wenn Ihre Zählung
              konstant höher als der Community-Durchschnitt ist, könnte Ihr Volk früher als typisch für Ihre Region eine Behandlung benötigen.
            </div>
            <span className="help-stat-card-good">Community-Durchschn. unter 2 = gesunde Saison</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Gute Stimmung %</div>
            <div className="help-stat-card-desc">
              Prozentsatz der Inspektionen in allen öffentlichen Bienenständen, die als „Ruhig" bewertet wurden. Eine hohe
              Community-Ruhestimmungsrate deutet auf gute regionale Genetik und niedrige Stressbedingungen hin
              (gute Tracht, geringer Schädlingsdruck). Ein fallender Gut-Stimmungs-Trend kann eine schwierige
              Saison für Bienen in Ihrer Region signalisieren.
            </div>
            <span className="help-stat-card-good">Über 75% = eine ruhige Saison community-weit</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Durchschn. Brutwaben</div>
            <div className="help-stat-card-desc">
              Durchschnittliche Anzahl der Brutwaben, die über alle öffentlichen Inspektionen aufgezeichnet wurden. Im Frühling steigt
              diese Zahl; im Herbst fällt sie. Der Vergleich Ihrer Brutwabenanzahl mit diesem Durchschnitt
              kann zeigen, ob sich Ihre Völker schneller oder langsamer entwickeln als andere in der Community.
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Durchschn. Inspektionsintervall</div>
            <div className="help-stat-card-desc">
              Durchschnittliche Anzahl von Tagen zwischen aufeinanderfolgenden Inspektionen, gemittelt pro Volk über alle
              öffentlichen Bienenstände. Kürzere Intervalle bedeuten aufmerksamere Imker — und mehr Daten
              für Trendanalysen. Der Community-Durchschnitt gibt Ihnen einen Eindruck von lokalen Inspektionsgewohnheiten.
            </div>
            <span className="help-stat-card-good">7–14 Tage in der aktiven Saison</span>
          </div>
        </div>
        <Screenshot caption="Die vier Statistik-Karten mit Live-Community-Daten" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zur Community-Statistik beitragen</h2>
        <p>
          Ihre Inspektionen tragen automatisch zur Community-Statistik bei, wenn Ihr Bienenstand auf
          <strong>öffentlich</strong> gesetzt ist. Keine weitere Aktion erforderlich. Einzelne Einträge sind
          für andere Benutzer nie sichtbar — nur Aggregate (Mittelwerte, Prozentsätze) werden veröffentlicht.
        </p>
        <p>
          Um einen Bienenstand öffentlich zu machen, öffnen Sie seine Detailseite und aktivieren Sie <em>Öffentlich machen</em>.
          Sie können jederzeit zu privat zurückwechseln.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Supporter werden</h2>
        <p>
          Die detaillierte Community-Aufschlüsselung — Trenddiagramme, regionale Aufschlüsselungen, Top-Bienenstände —
          ist für HivePulse-Supporter freigeschaltet. Supporter zu werden hilft auch dabei, die
          Plattform am Laufen zu halten und für alle Imker kostenlos zu halten.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Der Supporter-In-App-Kauf kommt bald. In der Zwischenzeit besuchen Sie die <a href="/contribute">Beitragsseite</a>, um zu erfahren, wie Sie das Projekt unterstützen können.</p>
        </div>
      </section>
    </>
  );
}
