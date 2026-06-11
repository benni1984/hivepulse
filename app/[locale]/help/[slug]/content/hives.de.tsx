import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HivesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Was ist ein Volkseintrag?</h2>
        <p>
          Ein Volkseintrag repräsentiert einen physischen Bienenstock. Er hat einen Namen, einen Typ und ein optionales
          QR-Code-Etikett. Die gesamte Inspektionshistorie ist dem Volkseintrag zugeordnet, sodass Sie den
          vollständigen Gesundheitstrend dieses Volkes im Laufe der Zeit verfolgen können.
        </p>
        <Screenshot src="/docs/screenshots/android-hive-detail.png" caption="Volk-Detailbildschirm mit Bienenstock-Typ, letztem Inspektionsdatum und Inspektionsliste" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Bienenstock-Typen</h2>
        <div className="help-stat-grid">
          {[
            { name: 'Langstroth', desc: 'Der verbreitetste Bienenstock in Nordamerika und international. Tiefen- und Mittelrähmchen mit herausnehmbaren Rähmchen.' },
            { name: 'Dadant', desc: 'Beliebt in Kontinentaleuropa. Größerer Brutraum als Langstroth, für starke Völker ausgelegt.' },
            { name: 'Top Bar', desc: 'Horizontaler Bienenstock, bei dem Bienen die Waben nach unten von beweglichen Leisten aufbauen. Verbreitet in Ostafrika und unter Naturimkern.' },
            { name: 'Warré', desc: 'Vertikal stapelbarer Bienenstock basierend auf natürlichem Wabenbau. Philosophie der minimalen Eingriffe.' },
            { name: 'Sonstiges', desc: 'Für alle nicht aufgeführten Bienenstock-Typen — Ableger, Schaubeuten usw.' },
          ].map(h => (
            <div className="help-stat-card" key={h.name}>
              <div className="help-stat-card-name">{h.name}</div>
              <div className="help-stat-card-desc">{h.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 8 }}>
          Die Wahl des richtigen Typs hat keinen Einfluss auf die Funktionalität — es ist lediglich eine Bezeichnung,
          die Ihnen hilft, Ihre Völker in der Liste zu unterscheiden.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Volk erstellen</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Bienenstand öffnen</strong>
              <p>Tippen Sie auf den Bienenstandnamen, um die Detailansicht zu öffnen.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Auf + (Neues Volk) tippen</strong>
              <p>Ein Formular erscheint mit der Abfrage nach Name und Bienenstock-Typ.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Namen wählen</strong>
              <p>Verwenden Sie ein beliebiges Benennungsschema: „Volk 1", „Blaue Box", „Südwiese A".</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Bienenstock-Typ auswählen</strong>
              <p>Wählen Sie aus der obigen Liste. Sie können dies später in der Volk-Detailansicht ändern.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>QR-Code zuweisen (optional)</strong>
              <p>Nach dem Speichern öffnen Sie das Volk und tippen auf <em>QR zuweisen</em>, um ein gedrucktes QR-Token zu verknüpfen.
              Siehe <a href="qr-codes">QR-Codes</a> für den vollständigen Ablauf.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/hive-create-form.png" caption="Neues-Volk-Formular mit Namensfeld und Bienenstock-Typ-Auswahl" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Volk ansehen</h2>
        <p>
          Die Volk-Detailansicht zeigt:
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Bienenstock-Typ und Datum der Hinzufügung</li>
          <li>Datum der letzten Inspektion</li>
          <li>Vollständige Inspektionshistorie, neueste zuerst</li>
          <li>Eine Schaltfläche zum Starten einer neuen Inspektion</li>
          <li>Im Web: Tabs für Inspektionen, Statistiken und Benutzerdefinierte Felder</li>
        </ul>
        <Screenshot src="/docs/screenshots/hive-detail-web.png" caption="Volk-Detailseite im Web mit dem Inspektions-Tab und Volksdaten" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tipps</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Geben Sie jedem Volk einen kurzen, eindeutigen Namen. Bei vielen Völkern sind Namen wie „A1" oder „Obergarten" in der Liste leichter zu lesen als „Volk 1", „Volk 2", „Volk 3".</p>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Das Löschen eines Volkes entfernt dauerhaft die gesamte Inspektionshistorie dieses Volkes. Exportieren Sie Ihre Daten vor dem Löschen, wenn Sie die Aufzeichnungen behalten möchten.</p>
        </div>
      </section>
    </>
  );
}
