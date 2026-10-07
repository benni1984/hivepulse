import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HomeAndTreatmentsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Twój dzień w skrócie</h2>
        <p>
          Góra listy pasiek (a w serwisie panelu) mówi ci, co ważne, gdy otwierasz
          HivePulse. Obejmuje też rodziny, które udostępnili ci inni pszczelarze. Dotknij rodziny, aby ją otworzyć.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>
            <strong>Następny przegląd.</strong> Rodzina ma termin po upływie twojego odstępu przypomnień od ostatniego przeglądu (liczonego od dnia,
            który wpisano, nie od dnia wprowadzenia). Widzisz, ile rodzin jest zaległych i ile ma termin w ciągu
            trzech najbliższych dni. Rodzina nigdy nieprzeglądana ma termin tyle dni po założeniu.
          </li>
          <li>
            <strong>Stan rodzin.</strong> W porządku, do obserwacji, alarm lub nieznany, odczytywany z ostatniego przeglądu:
            <em> alarm</em> przy wysokiej Varroa, matecznikach rojowych lub agresywnym temperamencie; <em>do obserwacji</em> przy średniej Varroa,
            nerwowym temperamencie lub niewidzianej matce; <em>nieznany</em> dla rodzin nigdy nieprzeglądanych. Rodziny,
            które wymagają uwagi, są wypisane z powodem.
          </li>
          <li>
            <strong>Nadchodzące zabiegi.</strong> To, co zaplanowano na najbliższe 30 dni, najpierw zaległe, każdy z
            przyciskiem <em>Zrobione</em>.
          </li>
          <li>
            <strong>Ogłoszenie.</strong> Od czasu do czasu może się tu pojawić karta od nas. To sam tekst: bez
            sieci reklamowej, bez śledzenia.
          </li>
        </ul>
        <p>
          Odstęp przypomnień i sezon ustawia się w <em>Ustawienia &rarr; Przypomnienia o przeglądach</em>. Poza
          sezonem terminy liczą się tak samo, a notatka o tym informuje.
        </p>
        <Screenshot android="/docs/screenshots/android-home-summary.png" web="/docs/screenshots/home-summary.png" caption="Ekran główny na górze listy pasiek" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zaplanuj zabieg</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Otwórz rodzinę lub pasiekę</strong>
              <p>Na stronie rodziny wybierz <em>Zabiegi</em>. Dla wszystkich rodzin pasieki użyj ikony zabiegów na pasku narzędzi pasieki.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Preparat, dzień i opcjonalna notatka</strong>
              <p>Na przykład kwas szczawiowy w dniu, w którym planujesz zabieg. Dotknij <em>Zaplanuj zabieg</em>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Oznacz jako zrobiony</strong>
              <p>Użyj <em>Zrobione</em> na ekranie głównym lub na liście. Zabieg oznaczony omyłkowo można otworzyć ponownie; kilka ostatnio wykonanych jest wypisanych poniżej.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            Planowanie to nie zapis. To, co faktycznie zastosowano, nadal wpisuje się w przeglądzie (<em>zastosowany
            zabieg</em>). Osoba, której udostępniono pojedyncze rodziny, może planować dla tych rodzin, nie dla całej pasieki.
          </p>
        </div>
        <Screenshot android="/docs/screenshots/android-treatments.png" web="/docs/screenshots/treatments-panel.png" caption="Zaplanuj zabieg i odhacz go" />
      </section>
    </>
  );
}
