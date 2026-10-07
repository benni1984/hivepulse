import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HornetTrackerContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Po co śledzić szerszenia azjatyckie?</h2>
        <p>
          <em>Vespa velutina</em> (szerszeń azjatycki) to inwazyjny drapieżnik, który poluje na pszczoły miodne
          przy wylotach uli, drastycznie ograniczając oblot i siłę rodziny. Wczesne wykrycie i
          zniszczenie gniazd to najskuteczniejsze środki zwalczania. Tropiciel szerszeni w HivePulse
          pozwala każdemu obywatelowi (bez konta) zgłaszać obserwacje, a pszczelarzom
          monitorować zagęszczenie gniazd w swojej okolicy.
        </p>
        <Screenshot src="/docs/screenshots/android-hornet-home.png" caption="Strona główna tropiciela szerszeni ze zbiorczymi statystykami i odnośnikami do działań" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zgłaszanie odłowu</h2>
        <p>
          „Odłów” to liczba szerszeni złapanych w pułapkę w danym czasie.
          Zgłoszenia nie wymagają konta.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Przejdź do Szerszenie → Zgłoś</strong>
              <p>W serwisie przejdź do <strong>/hornets/report</strong>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Wpisz liczbę odłowionych szerszeni i opcjonalnie lokalizację</strong>
              <p>Dodanie współrzędnych GPS umieszcza odłów na mapie i pomaga władzom śledzić wzorce rozprzestrzeniania.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Wyślij</strong>
              <p>Twoje zgłoszenie od razu trafia do łącznej liczby odłowów społeczności.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-hornet-report.png" caption="Formularz zgłoszenia odłowu z polem liczby i opcjonalnymi polami GPS" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zgłaszanie gniazda</h2>
        <p>
          Zgłoszenia gniazd zawierają lokalizację GPS i aktualny stan (Znalezione / Zlecono zniszczenie / Zniszczone).
          Potwierdzone gniazda pojawiają się jako czerwone pinezki na mapie szerszeni.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Przejdź do Szerszenie → Zgłoś</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Przełącz na kartę Gniazdo</strong>
              <p>Wpisz szerokość, długość geograficzną i stan gniazda.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Wyślij</strong>
              <p>Gniazdo pojawia się na mapie, aby widzieli je inni pszczelarze i lokalne władze.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zdjęcia obserwacji i głosowanie społeczności</h2>
        <p>
          Kanał obserwacji społeczności pozwala wysłać zdjęcie podejrzanego szerszenia azjatyckiego,
          aby inni mogli je zweryfikować. Pomyłki zdarzają się często (szerszenie azjatyckie bywają mylone
          ze szerszeniami europejskimi i bzygowatymi), więc głosowanie społeczności pomaga odsiać trafne zgłoszenia.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Przejdź do Szerszenie → Obserwacje społeczności</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Przeglądaj kanał</strong>
              <p>Każda karta pokazuje zdjęcie, datę zgłoszenia i aktualną liczbę głosów Tak/Nie.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Zagłosuj Tak lub Nie</strong>
              <p>Oddaj jeden głos na obserwację. Administratorzy mogą zmienić stan na Potwierdzone lub Odrzucone.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Wyślij własne zdjęcie</strong>
              <p>Dotknij przycisku +, prześlij zdjęcie i dodaj opcjonalnie dane lokalizacji.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-hornet-community.png" caption="Kanał obserwacji społeczności z kartami zdjęć i liczbą głosów" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Jak czytać statystyki</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Odłowione łącznie</div>
            <div className="help-stat-card-desc">Wszystkie szerszenie zgłoszone jako odłowione we wszystkich zgłoszeniach z pułapek na całej platformie. Rosnąca suma oznacza aktywny sezon.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Znalezione gniazda</div>
            <div className="help-stat-card-desc">Liczba przesłanych zgłoszeń gniazd. Wysoka liczba gniazd w twoim regionie oznacza większe ryzyko drapieżnictwa przy twojej pasiece.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Zniszczone gniazda</div>
            <div className="help-stat-card-desc">Gniazda ze stanem „Zniszczone”. Pokazuje skuteczność lokalnych działań zwalczających.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Oczekujące obserwacje</div>
            <div className="help-stat-card-desc">Zdjęcia obserwacji społeczności czekające na dość głosów, by je potwierdzić lub odrzucić. Pomóż zmniejszyć tę liczbę, głosując nad otwartymi obserwacjami.</div>
          </div>
        </div>
      </section>
    </>
  );
}
