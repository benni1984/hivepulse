import type HelpScreenshot from '@/components/HelpScreenshot';

export default function GettingStartedContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Czym jest HivePulse?</h2>
        <p>
          HivePulse to platforma pszczelarska do przeglądów i społeczności na iOS, Androida i w sieci.
          Pozwala zapisywać każdą wizytę przy rodzinie: liczbę roztoczy Varroa, temperament, obecność matki, ramki z czerwiem
          i więcej, a z tych danych robi wykresy i analizę trendów w czasie.
        </p>
        <p>
          Każdy zapisany przez ciebie przegląd zasila też (anonimowo) statystyki całej platformy,
          które pomagają szerszej społeczności pszczelarskiej rozumieć trendy zdrowia rodzin w różnych regionach.
        </p>
        <Screenshot src="/docs/screenshots/dashboard-apiary-list.png" caption="Panel HivePulse z przeglądem pasiek i listą rodzin" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Trzy aplikacje</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-globe" style={{ marginRight: 6 }} />Panel internetowy</div>
            <div className="help-stat-card-desc">
              Pełny panel pod adresem <strong>hivepulse.multihead.de</strong>. Najlepszy do zarządzania pasiekami,
              oglądania szczegółowych wykresów, generowania partii kodów QR i eksportu danych. Działa w każdej przeglądarce.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fab fa-apple" style={{ marginRight: 6 }} />Aplikacja na iOS</div>
            <div className="help-stat-card-desc">
              Natywna aplikacja na iPhone'a zaprojektowana do pracy w terenie. Zeskanuj kod QR na ulu, aby go od razu otworzyć,
              zapisz przegląd i obejrzyj statystyki rodziny, wszystko bez otwierania przeglądarki.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fab fa-android" style={{ marginRight: 6 }} />Aplikacja na Androida</div>
            <div className="help-stat-card-desc">
              Natywna aplikacja na Androida z tym samym projektem nastawionym na teren. Obsługuje skanowanie QR aparatem
              i działa na telefonach z Androidem 8 (API 26) i nowszym.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zakładanie konta</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Otwórz stronę rejestracji</strong>
              <p>W serwisie przejdź do <strong>/dashboard/register</strong> albo dotknij <em>Załóż konto</em> na ekranie logowania aplikacji mobilnych.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Wpisz swoje dane</strong>
              <p>Podaj adres e-mail, nazwę wyświetlaną, preferowany język (angielski, francuski, niemiecki, hiszpański lub polski) i hasło co najmniej 8-znakowe.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Zacznij dodawać pasieki</strong>
              <p>Po rejestracji trafiasz na listę pasiek. Dotknij bursztynowego przycisku <strong>Nowa pasieka</strong>, aby założyć pierwszą pasiekę.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/register-form.png" caption="Formularz rejestracji w panelu internetowym" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zalecane pierwsze kroki</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Załóż pasiekę</strong>
              <p>Nadaj jej nazwę i opcjonalnie lokalizację GPS, aby pojawiła się na mapie społeczności.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Dodaj swoje rodziny</strong>
              <p>Załóż jeden wpis na każdy fizyczny ul. Wybierz typ ula pasujący do twojego sprzętu.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Wygeneruj i wydrukuj kody QR</strong>
              <p>W serwisie wygeneruj partię kodów QR i wydrukuj PDF. Przyklej jedną etykietę na każdym ulu.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Zapisz pierwszy przegląd</strong>
              <p>Zeskanuj kod QR telefonem, dotknij <em>Nowy przegląd</em> i wpisz to, co widzisz.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Zapisuj przeglądy regularnie, nawet jeśli wpisujesz tylko liczbę roztoczy Varroa, a HivePulse zbuduje sensowne wykresy trendów już po kilku wizytach.</p>
        </div>
      </section>
      <section className="help-section">
        <h2 className="help-section-title">Przewodnik w aplikacjach</h2>
        <p>
          Przy pierwszym logowaniu do aplikacji na iPhone'a lub Androida krótki przewodnik do przewijania przedstawia
          kody QR, przeglądy, statystyki, przypomnienia i tropiciela szerszeni. Pomiń go, kiedy chcesz,
          i przywołaj później z <strong>Ustawienia → Pokaż przewodnik ponownie</strong>.
        </p>
      </section>


      <section className="help-section">
        <h2 className="help-section-title">Poruszanie się po aplikacjach</h2>
        <p>
          Aplikacje na iPhone'a i Androida są zbudowane tak samo.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Karty na dole:</strong> Pasieki, Skanuj, Szerszenie, Członkowie, Ustawienia.</li>
          <li><strong>Pasek narzędzi listy pasiek:</strong> statystyki, partie kodów QR, mapa przeniesień, rok pszczelarski.</li>
          <li><strong>Tworzenie czegokolwiek</strong> (pasieki, przeglądu, partii kodów QR, własnego pola) to zawsze bursztynowy przycisk w prawym dolnym rogu.</li>
          <li><strong>Ustawienia</strong> zawierają tę pomoc, informacje o wersjach z pełną listą funkcji i przewodnik.</li>
        </ul>
      </section>
    </>
  );
}
