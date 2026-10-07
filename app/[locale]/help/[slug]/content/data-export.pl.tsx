import type HelpScreenshot from '@/components/HelpScreenshot';

export default function DataExportContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Po co eksport?</h2>
        <p>
          Dane z twoich przeglądów należą do ciebie. Eksport daje lokalną kopię, którą możesz przekazać
          lekarzowi weterynarii, złożyć w krajowym organie pszczelarskim, wykorzystać w arkuszu
          kalkulacyjnym do własnej analizy albo zarchiwizować jako długoterminowy zapis niezależny od HivePulse.
        </p>
        <Screenshot android="/docs/screenshots/android-data-export.png" web="/docs/screenshots/hive-detail-export-area.png" caption="Eksport danych: wybór pasieki i formatu (JSON / CSV)" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Formaty eksportu</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">JSON</div>
            <div className="help-stat-card-desc">
              Format czytelny dla maszyn. Zachowuje wszystkie pola, także własne pola z dokładnymi
              wartościami. Najlepszy do archiwizacji lub importu do innego systemu. Struktura odpowiada
              kontraktowi API HivePulse.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">CSV</div>
            <div className="help-stat-card-desc">
              Zgodny z arkuszami kalkulacyjnymi. Każdy przegląd to jeden wiersz. Otwiera się bezpośrednio w Excelu,
              Arkuszach Google lub Numbers. Własne pola są dołączone jako dodatkowe kolumny.
              Najlepszy do ręcznej analizy lub przekazania osobom nietechnicznym.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Jak eksportować (serwis)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Przejdź do Ustawień</strong>
              <p>W panelu otwórz <strong>Ustawienia → Eksport danych</strong>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Wybierz pasiekę</strong>
              <p>Jeśli masz więcej niż jedną pasiekę, wskaż, którą wyeksportować. Każdy eksport obejmuje wszystkie rodziny i przeglądy w tej pasiece.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Wybierz JSON lub CSV</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Kliknij Pobierz</strong>
              <p>Plik zostaje pobrany do domyślnego folderu pobierania w przeglądarce.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/hive-detail-export-area.png" caption="Serwis: okno eksportu z wybraną pasieką i formatem CSV" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Jak eksportować (iOS i Android)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Otwórz Ustawienia</strong>
              <p>Dotknij karty Ustawienia na dolnym pasku nawigacji.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Przewiń do Eksportu danych</strong>
              <p>Ta sekcja pojawia się tylko wtedy, gdy masz co najmniej jedną pasiekę.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Dotknij Eksportuj dane</strong>
              <p>Pojawia się arkusz z wyborem pasieki i formatu.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Dotknij Pobierz</strong>
              <p>Na iOS otwiera się systemowe okno udostępniania, aby zapisać w Plikach, wysłać e-mailem lub przez AirDrop. Na Androidzie plik trafia do folderu Pobrane, a pojawia się krótkie powiadomienie.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Co zawiera eksport</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Wszystkie rodziny w wybranej pasiece</li>
          <li>Każdy przegląd każdej rodziny, ze wszystkimi wbudowanymi polami</li>
          <li>Wszystkie wartości własnych pól</li>
          <li>Daty przeglądów i znaczniki czasu utworzenia</li>
        </ul>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Eksport nie zawiera zdjęć (HivePulse nie przechowuje zdjęć z przeglądów). Nie zawiera też danych tokenów QR ani informacji o partiach.</p>
        </div>
      </section>
    </>
  );
}
