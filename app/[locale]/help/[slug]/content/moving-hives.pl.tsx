import type HelpScreenshot from '@/components/HelpScreenshot';

export default function MovingHivesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Zabieranie rodzin na pożytek</h2>
        <p>
          Pszczelarze wędrowni zabierają rodziny tam, gdzie coś kwitnie: akacja, rzepak, jodła, wrzos. Przewóz
          rodzin to jedno działanie: wybierasz rodziny, nowe miejsce, dzień i pożytek. Każde przeniesienie jest zapamiętywane, więc
          zawsze widzisz, gdzie rodzina stała i kiedy.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Przewóz rodzin</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Otwórz pasiekę, w której stoją rodziny</strong>
              <p>Dotknij <em>Przewieź rodziny</em> (dwie strzałki na pasku narzędzi; w serwisie przycisk na stronie pasieki).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Wybierz rodziny</strong>
              <p>Pojedyncze rodziny albo wszystkie przez <em>Wszystkie rodziny</em>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Wybierz, dokąd jadą</strong>
              <p>
                Jedna z twoich innych pasiek albo <em>Nowe miejsce</em> z nazwą i adresem. HivePulse wyszukuje
                adres, aby miejsce można było narysować na mapie.
              </p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Dzień, pożytek i notatka</strong>
              <p>Dniem jest dziś, chyba że go zmienisz (nie może być w przyszłości). Wybierz pożytek albo wpisz własny i dodaj notatkę, jeśli chcesz.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            <strong>Z powrotem tam, skąd przyjechały.</strong> Jeśli rodziny były już wcześniej zabrane do tej pasieki, na górze formularza pojawiają się przyciski, takie jak
            „Z powrotem do: Pole (3)”. Jedno dotknięcie wybiera te rodziny i ich poprzednie
            miejsce; potwierdzasz tylko dzień.
          </p>
        </div>
        <Screenshot src="/docs/screenshots/android-moves.png" caption="Wybierz rodziny, nowe miejsce, dzień i pożytek" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Gdzie rodzina stała</h2>
        <p>
          Strona każdej rodziny ma sekcję <em>Gdzie ta rodzina stała</em>: jej podróż na mapie i listę przeniesień.
          <em> Mapa przeniesień</em> (ikona mapy na pasku narzędzi listy pasiek lub w menu panelu w serwisie) rysuje podróż
          każdej rodziny, przystanek po przystanku z numerami, i można ją zawęzić do okresu.
        </p>
        <Screenshot android="/docs/screenshots/android-moves-overview.png" web="/docs/screenshots/moves-overview.png" caption="Mapa przeniesień rysuje podróż każdej rodziny" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Warto wiedzieć</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Rodziny pasieki może przewozić tylko jej właściciel.</li>
          <li>Rodzina zachowuje swój kod QR i wszystkie przeglądy podczas przewozu.</li>
          <li>Pusta pasieka zostaje; czeka na następny sezon.</li>
          <li>Przenoszenie w obrębie tej samej pasieki nie jest możliwe, bo nie ma czego przenosić.</li>
          <li>Aby miejsce było na mapie, oba miejsca potrzebują współrzędnych albo adresu.</li>
        </ul>
      </section>
    </>
  );
}
