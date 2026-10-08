import type HelpScreenshot from '@/components/HelpScreenshot';

export default function InspectionsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Czym jest przegląd?</h2>
        <p>
          Przegląd to pojedyncza wizyta przy rodzinie. Za każdym razem, gdy otwierasz ul, zapisujesz
          to, co zaobserwowano, jako wpis przeglądu: wskaźniki zdrowia, dane o sile rodziny, stan matki
          oraz zastosowane zabiegi czy dokarmianie. Z czasem te wpisy tworzą obraz zdrowia
          rodziny, który pokazują wykresy i analiza trendów.
        </p>
        <Screenshot src="/docs/screenshots/android-inspection-form.png" caption="Formularz przeglądu otwarty przy rodzinie, ze wszystkimi sekcjami" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zapisywanie przeglądu</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Otwórz rodzinę</strong>
              <p>Przejdź do ekranu szczegółów rodziny: przez listę pasiek albo skanując kod QR na ulu.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Dotknij bursztynowego przycisku Nowy przegląd</strong>
              <p>Otwiera się formularz przeglądu. Domyślną datą jest dziś, ale można ją zmienić (aby uzupełnić wcześniejsze wizyty).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Wpisz to, co widzisz</strong>
              <p>Wymagana jest tylko data. Wszystkie pozostałe pola są opcjonalne: zapisz to, co sprawdzono, a resztę pomiń.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Zapisz</strong>
              <p>Przegląd trafia do historii rodziny i od razu zasila wykresy trendów.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-inspection-form-bottom.png" caption="Zapisywanie przeglądu: widać pola daty i poziomu Varroa" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Wszystkie pola przeglądu</h2>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Zdrowie rodziny</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Poziom Varroa</div>
            <div className="help-stat-card-desc">
              Jak silnie rodzina jest zarażona roztoczem Varroa destructor, wybierany jako Brak, Niski, Średni lub Wysoki. Oceń go na podstawie próby z przemywania (cukier puder lub alkohol, ok. 100 pszczół) albo wkładki dennicowej. To najważniejszy wskaźnik zdrowia: duża liczba roztoczy skraca życie robotnic, osłabia rodzinę i przenosi wirusy.
            </div>
            <span className="help-stat-card-good">Dobrze: Brak lub Niski (0–2 roztocza na 100)</span>{' '}
            <span className="help-stat-card-warn">Działaj: Średni lub Wysoki (3+ roztocza na 100)</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Temperament rodziny</div>
            <div className="help-stat-card-desc">
              Jak zachowywały się pszczoły podczas przeglądu.
              <br /><strong>Spokojna</strong>: pszczoły łagodne, poruszały się wolno, mało żądleń.<br />
              <strong>Nerwowa</strong>: pszczoły pobudzone, trudne w pracy.<br />
              <strong>Agresywna</strong>: pszczoły aktywnie atakowały, wiele żądleń.
            </div>
            <span className="help-stat-card-good">Cel: głównie Spokojna</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Matka widziana</div>
            <div className="help-stat-card-desc">
              Zaznacz, jeśli podczas przeglądu na własne oczy zobaczono matkę.
              Jeśli widzisz świeże jaja, ale nie samą matkę, zostaw puste: jaja to tylko pośredni dowód.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Kolor matki</div>
            <div className="help-stat-card-desc">
              Międzynarodowe oznaczenie kolorami według roku. Biały (lata kończące się na 1/6), żółty (2/7),
              czerwony (3/8), zielony (4/9), niebieski (5/0). Pomaga śledzić wiek matki.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Widziane mateczniki rojowe</div>
            <div className="help-stat-card-desc">
              Zaznacz, jeśli zauważono mateczniki budowane do rójki. To wczesne ostrzeżenie,
              że rodzina może się rójkować w ciągu kilku dni.
            </div>
            <span className="help-stat-card-warn">Jeśli zaznaczone, trzeba działać</span>
          </div>
        </div>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: '24px 0 12px', color: 'var(--text-primary)' }}>Siła rodziny</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Ramki z czerwiem</div>
            <div className="help-stat-card-desc">
              Liczba ramek z czerwiem (jaja, larwy lub zasklepione komórki). To miara potencjału rozwoju rodziny.
              Silna, zdrowa rodzina w szczycie sezonu zwykle zapełnia 7–9 ramek w standardowym Langstrothcie.
            </div>
            <div className="help-stat-card-desc">W aplikacjach liczbę wybierasz, dotykając samej liczby: od 0 do 10 jako duże przyciski, wielkości dostosowanej do rąk w rękawicach. Dotknij wybranej liczby ponownie, aby ją wyczyścić.</div>
            <span className="help-stat-card-good">Dobrze (wiosna/lato): 6–9 ramek</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Ramki z miodem</div>
            <div className="help-stat-card-desc">
              Liczba ramek z zapasem miodu. Ważna do kontroli zimowych zapasów.
              Rodzina potrzebuje mniej więcej 15–20 kg miodu, aby przetrwać mroźną zimę.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Siła rodziny</div>
            <div className="help-stat-card-desc">
              Twoje ogólne wrażenie, jak silna jest rodzina: Słaba, Średnia lub Silna. Przydatne, gdy chcesz śledzić względną siłę bez liczenia poszczególnych ramek.
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: '24px 0 12px', color: 'var(--text-primary)' }}>Waga i zabiegi</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Waga (kg)</div>
            <div className="help-stat-card-desc">
              Całkowita waga ula z wagi pasiecznej. Śledzenie wagi w czasie pokazuje pożytki
              i zużycie zimowych zapasów bez otwierania ula.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Zastosowany zabieg</div>
            <div className="help-stat-card-desc">
              Pole tekstowe na zabieg przeciw Varroa, antybiotyk lub inny użyty preparat.
              Prowadzenie dokumentacji zabiegów jest w wielu krajach wymogiem prawnym.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Dokarmianie wykonane</div>
            <div className="help-stat-card-desc">
              Pole wyboru, że rodzina została dokarmiona. Rodzaj i ilość opisz w polu Notatki.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Rodzaj dokarmiania</div>
            <div className="help-stat-card-desc">
              Czym karmiono: syropem cukrowym, ciastem cukrowym, zamiennikiem pyłku itd.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Wskazówki</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Oceniaj poziom Varroa za każdym razem tak samo (ta sama metoda próby, te same progi), aby wykres trendu był porównywalny między przeglądami.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Nawet częściowy przegląd (tylko temperament i ramki z czerwiem) jest cenny. Regularne niepełne zapisy biją idealne zapisy robione raz w roku.</p>
        </div>
      </section>
    </>
  );
}
