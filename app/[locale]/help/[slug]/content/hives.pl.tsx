import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HivesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Czym jest wpis rodziny?</h2>
        <p>
          Wpis rodziny odpowiada jednemu fizycznemu ulowi z rodziną pszczelą. Ma nazwę, typ ula i opcjonalną
          naklejkę z kodem QR. Cała historia przeglądów jest przypisana do wpisu rodziny, więc możesz
          zobaczyć pełny przebieg zdrowia tej rodziny w czasie.
        </p>
        <Screenshot android="/docs/screenshots/android-hive-detail.png" web="/docs/screenshots/hive-detail-web.png" caption="Ekran szczegółów rodziny z typem ula, datą ostatniego przeglądu i listą przeglądów" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Typy uli</h2>
        <div className="help-stat-grid">
          {[
            { name: 'Langstroth', desc: 'Najpopularniejszy ul w Ameryce Północnej i na świecie. Korpusy wysokie i średnie z wyjmowanymi ramkami.' },
            { name: 'Dadant', desc: 'Popularny w Europie kontynentalnej. Większe gniazdo czerwiowe niż w Langstrothcie, przeznaczony dla dużych rodzin.' },
            { name: 'Top Bar', desc: 'Ul poziomy, w którym pszczoły budują plastry w dół z ruchomych beleczek. Spotykany we wschodniej Afryce i wśród pszczelarzy naturalnych.' },
            { name: 'Warré', desc: 'Ul pionowy ze stawianymi od dołu korpusami, oparty na naturalnej budowie plastrów. Filozofia minimalnej ingerencji.' },
            { name: 'Inny', desc: 'Dla każdego typu ula, którego nie ma na liście: odkłady, ule obserwacyjne itd.' },
          ].map(h => (
            <div className="help-stat-card" key={h.name}>
              <div className="help-stat-card-name">{h.name}</div>
              <div className="help-stat-card-desc">{h.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 8 }}>
          Wybór właściwego typu nie wpływa na działanie. To etykieta, która pomaga odróżnić
          twoje rodziny na liście.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zakładanie rodziny</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Otwórz pasiekę</strong>
              <p>Dotknij nazwy pasieki, aby otworzyć jej widok szczegółów.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Dotknij bursztynowego przycisku Nowa rodzina</strong>
              <p>Pojawi się formularz z prośbą o nazwę i typ ula.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Wybierz nazwę</strong>
              <p>Użyj dowolnego schematu, który ma dla ciebie sens: „Rodzina 1”, „Niebieski ul”, „Łąka południowa A”.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Wybierz typ ula</strong>
              <p>Wybierz z listy powyżej. Możesz to zmienić później na ekranie szczegółów rodziny.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Przypisz kod QR (opcjonalnie)</strong>
              <p>Po zapisaniu otwórz rodzinę i dotknij <em>Przypisz QR</em>, aby powiązać wydrukowany token QR.
              Pełny przebieg znajdziesz w temacie <a href="qr-codes">Kody QR</a>.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/hive-create-form.png" caption="Formularz nowej rodziny z polem nazwy i wyborem typu ula" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Edycja rodziny</h2>
        <p>
          Nazwę, typ ula, datę nabycia i notatki można zmienić w każdej chwili: w przeglądarce i,
          od ostatniego wydania, w obu aplikacjach.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Serwis</strong>: otwórz rodzinę i naciśnij <strong>Edytuj</strong>.</li>
          <li><strong>iPhone i Android</strong>: otwórz rodzinę i dotknij ołówka na pasku tytułu.</li>
        </ul>
        <p>
          Kod QR pozostaje przy wpisie rodziny, więc zmiana nazwy nie unieważnia naklejki na ulu.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Podgląd rodziny</h2>
        <p>
          Ekran szczegółów rodziny pokazuje:
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Typ ula i datę jego dodania</li>
          <li>Datę ostatniego przeglądu</li>
          <li>Pełną historię przeglądów, od najnowszego</li>
          <li>Przycisk rozpoczynający nowy przegląd</li>
          <li>W serwisie: karty Przeglądy, Statystyki i Własne pola</li>
        </ul>
        <Screenshot src="/docs/screenshots/hive-detail-web.png" caption="Serwis: strona szczegółów rodziny z kartą przeglądów i danymi rodziny" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Wskazówki</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Nadaj każdej rodzinie krótką, niepowtarzalną nazwę. Gdy rodzin jest dużo, nazwy takie jak „A1” czy „Górny ogród” czyta się na liście łatwiej niż „Rodzina 1”, „Rodzina 2”, „Rodzina 3”.</p>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Usunięcie rodziny trwale kasuje całą historię przeglądów tej rodziny. Jeśli chcesz zachować zapisy, wyeksportuj dane przed usunięciem.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">W aplikacjach: dodaj rodzinę ręcznie</h2>
        <p>
          Na stronie pasieki w aplikacjach na iPhone'a i Androida dotknij bursztynowego przycisku <em>Nowa rodzina</em> w prawym dolnym rogu, wpisz nazwę, typ ula i, jeśli chcesz, dzień nabycia oraz notatkę. Wydrukowana naklejka nie jest potrzebna; rodzina dostaje własny kod QR, który możesz wydrukować później. Wydrukowana naklejka też nadal działa: zeskanuj ją, a aplikacja zapyta o te same dane.
        </p>
      </section>
    </>
  );
}
