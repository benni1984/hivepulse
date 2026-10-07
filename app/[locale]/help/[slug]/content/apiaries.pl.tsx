import type HelpScreenshot from '@/components/HelpScreenshot';

export default function AviariesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Czym jest pasieka?</h2>
        <p>
          Pasieka to nazwane miejsce, które grupuje jeden lub więcej uli. Odpowiada fizycznemu
          miejscu (ogrodowi, polu, dachowi), w którym stoją twoje rodziny pszczele.
          Każda rodzina w HivePulse należy do dokładnie jednej pasieki.
        </p>
        <p>
          Pasiekę można uczynić <strong>publiczną</strong>: na mapie społeczności pojawia się wtedy pinezka,
          a twoje zanonimizowane dane z przeglądów trafiają do statystyk całej platformy,
          które wszyscy pszczelarze widzą na ekranie Członkowie.
        </p>
        <Screenshot src="/docs/screenshots/dashboard-apiary-list.png" caption="Lista pasiek w panelu internetowym z dwiema pasiekami i liczbą rodzin" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tworzenie pasieki</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Otwórz listę pasiek</strong>
              <p>W serwisie przejdź do <strong>/dashboard</strong>. W aplikacji na iOS lub Androida to pierwszy ekran po zalogowaniu.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Dotknij bursztynowego przycisku Nowa pasieka</strong>
              <p>Przycisk jest w prawym dolnym rogu. Wysuwa się formularz z poniższymi polami.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Uzupełnij dane</strong>
              <p><strong>Nazwa</strong> (wymagana): krótka etykieta, np. „Ogród przy domu” albo „Skraj lasu”.<br/>
              <strong>Opis</strong>: opcjonalne notatki widoczne tylko dla ciebie.<br/>
              <strong>Adres</strong>: opcjonalny adres w wolnym tekście.<br/>
              <strong>Szerokość i długość geograficzna</strong>: współrzędne dziesiętne pinezki na mapie. Jeśli ich nie podasz, pasieka nie pojawi się na mapie, nawet jeśli jest publiczna.<br/>
              <strong>Uczyń publiczną</strong>: zaznacz, aby udostępnić społeczności lokalizację i zanonimizowane statystyki.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Zapisz</strong>
              <p>Nowa pasieka od razu pojawia się na liście.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/apiary-create-form.png" caption="Formularz tworzenia pasieki z polami nazwy, opisu i GPS" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Edycja pasieki i późniejsze upublicznienie</h2>
        <p>
          Wszystko, co wpisano przy tworzeniu pasieki, można później zmienić, także to, czy pojawia się
          na mapie społeczności. Nie trzeba w tym celu zakładać nowej pasieki.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Serwis</strong>: otwórz pasiekę i naciśnij <strong>Edytuj</strong> nad listą rodzin.</li>
          <li><strong>iPhone i Android</strong>: otwórz pasiekę i dotknij ołówka na pasku tytułu.</li>
        </ul>
        <p>
          Formularz zawiera nazwę, opis, adres i przełącznik <strong>Pokaż na mapie publicznej</strong>.
          Włączenie go umieszcza pasiekę na mapie społeczności, a jej przeglądy zaczynają liczyć się
          w liczbach społeczności; wyłączenie zdejmuje ją z mapy.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Jeśli mapa społeczności i statystyki członków pokazują u ciebie zero, zwykle przyczyną jest ten przełącznik: pasieki prywatne nigdy nie są liczone.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Pasieki publiczne i prywatne</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Prywatna (domyślnie)</div>
            <div className="help-stat-card-desc">
              Tylko ty widzisz pasiekę, jej rodziny i wszystkie dane z przeglądów. Nic nie jest udostępniane społeczności.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Publiczna</div>
            <div className="help-stat-card-desc">
              Na mapie społeczności pojawia się pinezka w miejscu twoich współrzędnych GPS. Twoje przeglądy
              zasilają statystyki całej platformy (tylko średnie, pojedyncze zapisy nigdy nie są ujawniane).
              Nie publikujemy żadnych informacji pozwalających zidentyfikować użytkownika.
            </div>
          </div>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Twoje współrzędne GPS są przechowywane z <strong>dokładnością do miasta</strong>: dokładna pinezka jest zaokrąglana, aby chronić twoją prywatność.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Usuwanie pasieki</h2>
        <p>
          W serwisie otwórz stronę szczegółów pasieki i przewiń do strefy zagrożenia. W aplikacji przesuń
          wiersz pasieki w lewo. <strong>Pasiekę można usunąć tylko wtedy, gdy nie zawiera rodzin.</strong> Najpierw usuń
          wszystkie rodziny, potem pasiekę.
        </p>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Usunięcie pasieki jest trwałe: wszystkie rodziny i ich historia przeglądów przepadają. Jeśli potrzebujesz kopii, najpierw wyeksportuj dane.</p>
        </div>
      </section>
    </>
  );
}
