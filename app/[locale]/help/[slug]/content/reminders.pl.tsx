import type HelpScreenshot from '@/components/HelpScreenshot';

export default function RemindersContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Czym są przypomnienia o przeglądach?</h2>
        <p>
          Przypomnienia o przeglądach powiadamiają cię, gdy rodzina jest spóźniona z wizytą, według wybranego
          odstępu. Regularne przeglądy są podstawą dobrej walki z Varroa, a
          przypomnienia pomagają trzymać się planu nawet w pracowite tygodnie.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p><strong>Dostarczanie powiadomień push będzie dostępne wkrótce.</strong> Możesz już teraz ustawić preferencje, a zostaną zapisane. Powiadomienia zaczną przychodzić po uruchomieniu infrastruktury push.</p>
        </div>
        <Screenshot src="/docs/screenshots/android-settings-reminders.png" caption="Sekcja Przypomnienia o przeglądach w Ustawieniach z przełącznikiem i ustawieniem odstępu" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Ustawianie przypomnień</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Otwórz Ustawienia</strong>
              <p>Dotknij karty Ustawienia na dolnym pasku nawigacji na iOS lub Androidzie.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Przewiń do Przypomnień o przeglądach</strong>
              <p>Włącz przełącznik, aby włączyć przypomnienia.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Ustaw odstęp przypomnień</strong>
              <p>Wybierz, po ilu dniach od ostatniego przeglądu chcesz dostać przypomnienie. Częsty wybór to 7 dni w aktywnym sezonie.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Ustaw okno sezonu</strong>
              <p>Wybierz miesiące, w których przypomnienia mają być aktywne (np. kwiecień–wrzesień w klimacie umiarkowanym). Poza tym oknem przypomnienia nie są wysyłane: nie trzeba co tydzień przeglądać rodziny w czasie zimowli.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Dotknij Zapisz ustawienia przypomnień</strong>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Ustawienia przypomnień po kolei</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Odstęp przypomnień</div>
            <div className="help-stat-card-desc">
              Liczba dni od ostatniego przeglądu, po której pojawia się przypomnienie.
              Częste wybory: 7 dni (co tydzień) przy aktywnej walce z Varroa, 14 dni dla pszczelarzy
              o lżejszym podejściu, 21–28 dni dla pszczelarzy naturalnych.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Początek sezonu</div>
            <div className="help-stat-card-desc">
              Pierwszy miesiąc aktywnego sezonu przeglądów. Przypomnienia nie pojawią się przed tym miesiącem.
              W Europie Północnej to zwykle kwiecień lub maj.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Koniec sezonu</div>
            <div className="help-stat-card-desc">
              Ostatni miesiąc aktywnego sezonu. Po nim przypomnienia milkną
              do początku następnego sezonu. W Europie Północnej to zwykle sierpień lub wrzesień.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Push, e-mail albo oba</h2>
        <p>
          Przypomnienie może dotrzeć do ciebie na dwa sposoby, włączane niezależnie w profilu:
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Powiadomienie push</strong>: w aplikacjach na iPhone'a i Androida, na urządzeniu, na którym zezwolono na powiadomienia.</li>
          <li><strong>E-mail</strong>: na adres konta, co jest jedyną opcją, jeśli pracujesz tylko w przeglądarce.</li>
        </ul>
        <p>
          Oba kanały używają tych samych ustawień odstępu i sezonu, więc włączenie e-maila nie podwaja harmonogramu:
          dodaje tylko drugi kanał dla tego samego przypomnienia.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Wskazówki</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Dopasuj okno sezonu do lokalnego klimatu: nie ma potrzeby przypominania o przeglądzie rodziny, która siedzi w kłębie zimowym.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>W krytycznym oknie zabiegu przeciw Varroa przed zimą (zwykle sierpień–wrzesień) rozważ tymczasowe skrócenie odstępu do 7 dni, aby mieć liczbę roztoczy pod kontrolą.</p>
        </div>
      </section>
    </>
  );
}
