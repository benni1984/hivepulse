import type HelpScreenshot from '@/components/HelpScreenshot';

export default function AccountContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Edycja profilu</h2>
        <p>
          Profil przechowuje twoją nazwę wyświetlaną i preferowany język. Nazwa wyświetlana pojawia się
          w panelu administratora, jeśli twoje konto ma uprawnienia administratora. Ustawienie języka
          określa, w jakim języku aplikacje mobilne pokazują etykiety interfejsu.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Serwis:</strong> przejdź do <strong>Panel → Profil</strong> (<code>/dashboard/profile</code>).
              <strong> Aplikacja:</strong> otwórz kartę Ustawienia.
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Zmień nazwę wyświetlaną</strong>
              <p>Wpisz nową nazwę i dotknij Zapisz profil / Zapisz.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Zmień język</strong>
              <p>Wybierz angielski, francuski, niemiecki, hiszpański lub polski w polu wyboru języka.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-settings-account.png" caption="Sekcja profilu w Ustawieniach z polem nazwy i wyborem języka" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zmiana hasła</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Otwórz sekcję Zmień hasło</strong>
              <p>W serwisie: Panel → Profil. W aplikacji: Ustawienia → przewiń do sekcji Zmień hasło.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Wpisz obecne hasło</strong>
              <p>To potwierdza, że jesteś właścicielem konta.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Wpisz i potwierdź nowe hasło</strong>
              <p>Co najmniej 8 znaków.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Dotknij Zmień hasło</strong>
              <p>Sesja pozostaje aktywna. Wszystkie pozostałe aktywne sesje nadal obowiązują.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Nie pamiętasz obecnego hasła? Użyj linku <strong>Nie pamiętasz hasła?</strong> na ekranie logowania, aby dostać e-mailem link do zresetowania.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Usuwanie konta</h2>
        <p>
          Usunięcie konta trwale kasuje twój adres e-mail, nazwę wyświetlaną, wszystkie pasieki, wszystkie rodziny
          i wszystkie zapisane przeglądy. Tego <strong>nie można cofnąć</strong>.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Najpierw wyeksportuj dane</strong>
              <p>Pobierz eksport JSON lub CSV każdej pasieki, jeśli chcesz zachować swoje zapisy.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Otwórz Strefę zagrożenia</strong>
              <p>W serwisie: Panel → Profil → Strefa zagrożenia. W aplikacji: Ustawienia → przewiń na sam dół.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Dotknij Usuń konto i potwierdź</strong>
              <p>Okno potwierdzenia wyjaśnia, co zostanie usunięte. Potwierdź, aby kontynuować.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Twoje dane z przeglądów mogły wejść do statystyk społeczności. Usunięcie konta wyłącza je z przyszłych zestawień, ale statystyki historyczne, które już policzono, nie są przeliczane wstecz.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Wylogowanie</h2>
        <p>
          Dotknij <strong>Wyloguj się</strong> w Ustawieniach (aplikacja) lub w rozwijanym menu w prawym górnym rogu (serwis).
          Twój token sesji zostaje unieważniony na serwerze. Nastąpi przekierowanie na ekran logowania.
          Twoje dane pozostają: wylogowanie niczego nie usuwa.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Logowanie przez Apple lub Google</h2>
        <p>
          Możesz zalogować się kontem Apple lub Google zamiast hasłem: Apple na iPhonie i w serwisie, Google na Androidzie, iPhonie i w serwisie. Jeśli adres e-mail jest ten sam, trafiasz na istniejące konto, ze wszystkimi rodzinami. HivePulse otrzymuje od nich tylko twoje imię i adres, nigdy hasło.
        </p>
        <p>
          Konto założone w ten sposób nie ma hasła, dlatego nie widać opcji <em>Zmień hasło</em>. Formularz e-mail nadal jest dostępny jako dyskretny link pod przyciskami.
        </p>
      </section>
    </>
  );
}
