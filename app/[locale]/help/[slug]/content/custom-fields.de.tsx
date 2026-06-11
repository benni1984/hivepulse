import type HelpScreenshot from '@/components/HelpScreenshot';

export default function CustomFieldsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Was sind benutzerdefinierte Felder?</h2>
        <p>
          Benutzerdefinierte Felder ermöglichen es Ihnen, dem Inspektionsformular zusätzliche Fragen hinzuzufügen, die nicht im
          integrierten Set enthalten sind. Zum Beispiel: ein Kontrollkästchen für „Ableger erstellt", eine Zahl für
          „Vorratswaben" oder eine Auswahlliste für die derzeit blühende Nektarquelle.
        </p>
        <p>
          Felder werden derzeit im <strong>Web-Dashboard</strong> verwaltet und erscheinen auf dem
          Inspektionsformular auf allen Plattformen.
        </p>
        <Screenshot src="/docs/screenshots/custom-fields-list.png" caption="Einstellungsseite für benutzerdefinierte Felder mit einer Liste von Feldern im Benutzerbereich" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Feldbereich</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Benutzerbereich</div>
            <div className="help-stat-card-desc">
              Gilt für <strong>jede Inspektion in allen Ihren Bienenständen</strong>. Verwenden Sie dies für Felder,
              die für Ihre Praxis immer relevant sind — z. B. „Behandlungsart" oder „Ableger erstellt".
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Bienenstandbereich</div>
            <div className="help-stat-card-desc">
              Gilt nur für Inspektionen <strong>innerhalb eines bestimmten Bienenstands</strong>. Verwenden Sie dies für Felder,
              die nur an einem Standort relevant sind — z. B. „Nähe zu Rapsfeld" für einen
              Bienenstand in der Nähe eines Rapsfeldes.
            </div>
          </div>
        </div>
        <p style={{ marginTop: 8 }}>
          Wenn ein Benutzerbereichsfeld und ein Bienenstandbereichsfeld denselben Namen haben, hat das Bienenstandbereichsfeld
          für Völker in diesem Bienenstand Vorrang.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Feldtypen</h2>
        <div className="help-stat-grid">
          {[
            { name: 'Text', desc: 'Eine Freitexteingabe. Gut für Notizen, Beobachtungen oder jede offene Antwort.' },
            { name: 'Zahl', desc: 'Eine numerische Eingabe. Als Dezimalzahl gespeichert — nützlich für Messungen wie Rähmchenanzahl oder Gewichte.' },
            { name: 'Boolean', desc: 'Ein Ja/Nein-Schalter. Am besten für erledigte oder nicht erledigte Aktionen: „heute gefüttert", „neue Waben gezogen".' },
            { name: 'Datum', desc: 'Eine Datumsauswahl. Verwenden Sie es zur Aufzeichnung bestimmter Ereignisse — „letztes Behandlungsdatum", „Königin eingeführt am".' },
            { name: 'Auswahl', desc: 'Eine Dropdown-Liste mit Ihren eigenen Optionen. Nützlich für kategorische Daten — „Nektarquelle", „Behandlungsprodukt".' },
          ].map(f => (
            <div className="help-stat-card" key={f.name}>
              <div className="help-stat-card-name">{f.name}</div>
              <div className="help-stat-card-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Benutzerdefiniertes Feld erstellen</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Zu Felddefinitionen gehen</strong>
              <p>Im Web-Dashboard navigieren Sie zu <strong>Dashboard → Felddefinitionen</strong>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Ziel auswählen</strong>
              <p><strong>Volk</strong>-Felder erscheinen im Volk-Detailformular. <strong>Inspektions</strong>-Felder erscheinen im Inspektionsformular — dies ist die häufigste Wahl.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Bereich wählen</strong>
              <p>Benutzer (alle Bienenstände) oder Bienenstand (ein bestimmter Bienenstand).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Feld benennen und Typ wählen</strong>
              <p>Für Auswahlfelder geben Sie auch die Dropdown-Optionen ein (eine pro Zeile).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Speichern</strong>
              <p>Das Feld erscheint sofort im Inspektionsformular für die relevanten Bienenstände.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/custom-field-create.png" caption="Erstellen eines neuen benutzerdefinierten Felds — Name, Typ und Bereich sind ausgewählt" />
      </section>
    </>
  );
}
