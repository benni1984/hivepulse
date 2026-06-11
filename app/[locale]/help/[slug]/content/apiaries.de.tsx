import type HelpScreenshot from '@/components/HelpScreenshot';

export default function AviariesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Was ist ein Bienenstand?</h2>
        <p>
          Ein Bienenstand ist ein benannter Standort, der einen oder mehrere Bienenstöcke zusammenfasst. Er steht für
          einen physischen Ort — Ihren Garten, ein Feld, ein Dach — wo Ihre Völker leben.
          Jedes Volk in HivePulse gehört zu genau einem Bienenstand.
        </p>
        <p>
          Bienenstände können <strong>öffentlich</strong> gemacht werden, wodurch eine Kartennadel auf der Community-Karte
          erscheint und Ihre anonymisierten Inspektionsdaten zur plattformweiten Statistik beitragen, die
          alle Imker auf dem Mitglieder-Bildschirm sehen können.
        </p>
        <Screenshot caption="Bienenstandliste im Web-Dashboard mit zwei Bienenständen und Völkeranzahl" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Bienenstand erstellen</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Bienenstandliste öffnen</strong>
              <p>Im Web unter <strong>/dashboard</strong>. In iOS oder Android ist es der erste Bildschirm nach dem Login.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Auf + tippen</strong>
              <p>Ein Erstellungsformular öffnet sich mit den folgenden Feldern.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Details ausfüllen</strong>
              <p><strong>Name</strong> (erforderlich) — eine kurze Bezeichnung wie „Hausgarten" oder „Waldrand".<br/>
              <strong>Beschreibung</strong> — optionale Notizen, nur für Sie sichtbar.<br/>
              <strong>Adresse</strong> — optionale Freitextadresse.<br/>
              <strong>Breitengrad &amp; Längengrad</strong> — dezimale Koordinaten für die Kartennadel. Wenn Sie diese leer lassen, erscheint der Bienenstand nicht auf der Karte, auch wenn er öffentlich gemacht wird.<br/>
              <strong>Öffentlich machen</strong> — aktivieren, um Standort und anonymisierte Statistiken mit der Community zu teilen.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Speichern</strong>
              <p>Der neue Bienenstand erscheint sofort in Ihrer Liste.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Bienenstand-Erstellungsformular mit Name, Beschreibung und GPS-Feldern" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Öffentliche vs. private Bienenstände</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Privat (Standard)</div>
            <div className="help-stat-card-desc">
              Nur Sie können den Bienenstand, seine Völker und alle Inspektionsdaten sehen. Nichts wird mit der Community geteilt.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Öffentlich</div>
            <div className="help-stat-card-desc">
              Eine Kartennadel erscheint auf der Community-Karte an Ihren GPS-Koordinaten. Ihre Inspektionsdaten
              fließen in die plattformweite Statistik ein (nur Durchschnittswerte — einzelne Datensätze werden nie veröffentlicht).
              Es werden keine personenbezogenen Daten veröffentlicht.
            </div>
          </div>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Ihre GPS-Koordinaten werden mit <strong>Genauigkeit auf Stadtebene</strong> gespeichert — die genaue Nadel wird gerundet, um Ihre Privatsphäre zu schützen.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Bienenstand löschen</h2>
        <p>
          Im Web öffnen Sie die Bienenstand-Detailseite und scrollen zur Gefahrenzone. Auf dem Handy wischen Sie
          in der Bienenstandzeile nach links. <strong>Ein Bienenstand kann nur gelöscht werden, wenn er keine Völker enthält.</strong> Löschen Sie
          zuerst alle Völker und dann den Bienenstand.
        </p>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Das Löschen eines Bienenstands ist dauerhaft — alle Völker und ihre Inspektionshistorie gehen verloren. Exportieren Sie Ihre Daten zuerst, wenn Sie eine Kopie benötigen.</p>
        </div>
      </section>
    </>
  );
}
