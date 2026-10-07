import type HelpScreenshot from '@/components/HelpScreenshot';

export default function CustomFieldsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Czym są własne pola?</h2>
        <p>
          Własne pola pozwalają dodać do formularza przeglądu dodatkowe pytania, których nie ma we
          wbudowanym zestawie. Na przykład: pole wyboru „odkład zrobiony”, liczba „ramek z zapasami”
          albo lista rozwijana z pożytkiem, który akurat kwitnie.
        </p>
        <p>
          Pola zarządza się obecnie w <strong>panelu internetowym</strong>, a pojawiają się w
          formularzu przeglądu na wszystkich platformach.
        </p>
        <Screenshot src="/docs/screenshots/custom-fields-list.png" caption="Strona ustawień Własnych pól z listą pól na poziomie użytkownika" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zakres pola</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Zakres użytkownika</div>
            <div className="help-stat-card-desc">
              Dotyczy <strong>każdego przeglądu we wszystkich twoich pasiekach</strong>. Użyj dla pól,
              które zawsze mają znaczenie w twojej praktyce, np. „rodzaj zabiegu” albo „odkład”.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Zakres pasieki</div>
            <div className="help-stat-card-desc">
              Dotyczy tylko przeglądów <strong>w jednej wybranej pasiece</strong>. Użyj dla pól istotnych
              tylko w jednym miejscu, np. „bliskość rzepaku” dla pasieki przy polu rzepaku.
            </div>
          </div>
        </div>
        <p style={{ marginTop: 8 }}>
          Jeśli pole na poziomie użytkownika i pole na poziomie pasieki mają tę samą nazwę, dla rodzin
          w tej pasiece pierwszeństwo ma pole pasieki.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Typy pól</h2>
        <div className="help-stat-grid">
          {[
            { name: 'Tekst', desc: 'Pole tekstowe. Dobre na notatki, obserwacje i każdą otwartą odpowiedź.' },
            { name: 'Liczba', desc: 'Pole liczbowe. Zapisywane jako liczba dziesiętna, przydatne do pomiarów, np. liczby ramek lub wagi.' },
            { name: 'Tak / Nie', desc: 'Przełącznik tak/nie. Najlepszy do czynności zrobionych lub niezrobionych: „karmiono dziś”, „zbudowano nowy plaster”.' },
            { name: 'Data', desc: 'Wybór daty. Użyj do zapisywania konkretnych zdarzeń: „data ostatniego zabiegu”, „matka dodana dnia”.' },
            { name: 'Wybór', desc: 'Lista rozwijana z twoimi opcjami. Przydatna dla danych kategorycznych: „pożytek”, „preparat”.' },
          ].map(f => (
            <div className="help-stat-card" key={f.name}>
              <div className="help-stat-card-name">{f.name}</div>
              <div className="help-stat-card-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tworzenie własnego pola</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Przejdź do Własnych pól</strong>
              <p>W panelu internetowym przejdź do <strong>Panel → Własne pola</strong>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Wybierz, czego dotyczy</strong>
              <p>Pola <strong>Rodziny</strong> pojawiają się w formularzu szczegółów rodziny. Pola <strong>Przeglądu</strong> pojawiają się w formularzu przeglądu, to najczęstszy wybór.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Wybierz zakres</strong>
              <p>Użytkownik (wszystkie pasieki) albo Pasieka (jedna wybrana pasieka).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Nazwij pole i wybierz typ</strong>
              <p>Dla pól typu Wybór wpisz też opcje listy rozwijanej (po jednej w wierszu).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Zapisz</strong>
              <p>Pole od razu pojawia się w formularzu przeglądu dla odpowiednich pasiek.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/custom-field-create.png" caption="Tworzenie nowego własnego pola: wybrane są nazwa, typ i zakres" />
      </section>
    </>
  );
}
