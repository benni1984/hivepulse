import type HelpScreenshot from '@/components/HelpScreenshot';

export default function RemindersContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Was sind Inspektionserinnerungen?</h2>
        <p>
          Inspektionserinnerungen benachrichtigen Sie, wenn ein Volk basierend auf Ihrem gewählten
          Intervall überfällig für einen Besuch ist. Konsistente Inspektionen sind die Grundlage guter Varroa-Behandlung —
          Erinnerungen helfen Ihnen, auch in vollen Wochen im Zeitplan zu bleiben.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p><strong>Push-Benachrichtigungen kommen bald.</strong> Sie können Ihre Einstellungen jetzt vornehmen und sie werden gespeichert. Benachrichtigungen beginnen, sobald die Push-Infrastruktur aktiviert wird.</p>
        </div>
        <Screenshot caption="Inspektionserinnerungs-Abschnitt in den Einstellungen mit Schalter und Intervall-Stepper" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Erinnerungen einrichten</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Einstellungen öffnen</strong>
              <p>Tippen Sie auf den Einstellungs-Tab in der unteren Navigation auf iOS oder Android.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Zu Inspektionserinnerungen scrollen</strong>
              <p>Aktivieren Sie den Schalter, um Erinnerungen einzuschalten.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Erinnerungsintervall festlegen</strong>
              <p>Wählen Sie, wie viele Tage nach der letzten Inspektion Sie erinnert werden möchten. Eine häufige Wahl sind 7 Tage in der aktiven Saison.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Saisonfenster festlegen</strong>
              <p>Wählen Sie die Monate, in denen Erinnerungen aktiv sein sollen (z. B. April–September für gemäßigte Klimazonen). Außerhalb dieses Fensters werden keine Erinnerungen gesendet — es ist nicht nötig, ein überwintertes Volk wöchentlich zu inspizieren.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Auf Erinnerungseinstellungen speichern tippen</strong>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Erinnerungseinstellungen erklärt</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Erinnerungsintervall</div>
            <div className="help-stat-card-desc">
              Anzahl der Tage nach der letzten Inspektion, bevor eine Erinnerung ausgelöst wird.
              Häufige Wahl: 7 Tage (wöchentlich) für aktives Varroa-Management, 14 Tage für
              sanfte Imker, 21–28 Tage für Naturimker.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Saisonbeginn</div>
            <div className="help-stat-card-desc">
              Der erste Monat der aktiven Inspektionssaison. Erinnerungen werden vor diesem Monat nicht ausgelöst.
              In Nordeuropa ist dies typischerweise April oder Mai.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Saisonende</div>
            <div className="help-stat-card-desc">
              Der letzte Monat der aktiven Saison. Nach diesem Monat werden Erinnerungen bis zum
              nächsten Saisonbeginn stummgeschaltet. In Nordeuropa ist dies typischerweise August oder September.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tipps</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Stellen Sie das Saisonfenster passend zu Ihrem lokalen Klima ein — es ist nicht nötig, daran erinnert zu werden, ein Volk in der Wintertraube zu inspizieren.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Erwägen Sie während des kritischen Varroa-Behandlungsfensters vor dem Winter (typischerweise August–September), Ihr Intervall vorübergehend auf 7 Tage zu verkürzen, um bei den Milbenzahlen auf dem Laufenden zu bleiben.</p>
        </div>
      </section>
    </>
  );
}
