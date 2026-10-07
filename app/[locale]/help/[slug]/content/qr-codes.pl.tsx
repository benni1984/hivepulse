import type HelpScreenshot from '@/components/HelpScreenshot';

export default function QrCodesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Po co kody QR?</h2>
        <p>
          Gdy stoisz w pasiece w rękawicach, szukanie właściwej rodziny w aplikacji trwa długo.
          Naklejka z kodem QR na każdym ulu pozwala zeskanować i otworzyć w mniej niż dwie sekundy:
          właściwy ekran szczegółów rodziny otwiera się od razu, gotowy do nowego przeglądu.
        </p>
        <Screenshot android="/docs/screenshots/android-qr-batches.png" web="/docs/screenshots/qr-batch-detail.png" caption="Lista partii kodów QR i szczegóły partii: generowanie i pobieranie etykiet" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Krok 1: wygeneruj partię (serwis)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Przejdź do Partii kodów QR</strong>
              <p>W panelu internetowym otwórz <strong>Ustawienia → Partie kodów QR</strong> (lub przejdź bezpośrednio do <code>/dashboard/qr-batches</code>).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Dotknij Nowa partia</strong>
              <p>Wpisz liczbę kodów do wygenerowania (1–50). Jeden kod na każdy fizyczny ul.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Pobierz PDF</strong>
              <p>Otwórz nową partię i kliknij <em>Pobierz PDF</em>. PDF zawiera jeden kod QR na stronę, w rozmiarze pasującym do standardowych arkuszy etykiet.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Wydrukuj i przyklej</strong>
              <p>Jeśli to możliwe, drukuj na papierze etykiet odpornym na pogodę. Przyklej jedną etykietę na każdym ulu, dobrym miejscem jest pokrywa.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/qr-batch-detail.png" caption="Strona szczegółów partii kodów QR z listą tokenów i przyciskiem Pobierz PDF" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Krok 2: powiąż kod z rodziną (aplikacja)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Otwórz ekran szczegółów rodziny</strong>
              <p>Przejdź do rodziny, którą chcesz powiązać (przez listę pasiek).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Dotknij Przypisz QR / Załóż rodzinę</strong>
              <p>Aparat otwiera się w trybie skanowania.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Zeskanuj wydrukowaną etykietę</strong>
              <p>Skieruj aparat na kod QR na etykiecie. Token jest odczytywany automatycznie, bez naciskania przycisku.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Potwierdź powiązanie</strong>
              <p>Ekran potwierdzenia pokazuje nazwę rodziny. Dotknij <em>Potwierdź</em>, aby zakończyć. Token QR jest teraz na stałe powiązany z tą rodziną.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-qr-scan.png" caption="Nakładka skanera QR ze skanowanym kodem i arkuszem potwierdzenia" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Krok 3: skanuj, aby otworzyć podczas przeglądów</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Dotknij ikony skanowania</strong>
              <p>Skaner QR jest dostępny na dolnym pasku nawigacji, zarówno na iOS, jak i na Androidzie.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Skieruj aparat na etykietę rodziny</strong>
              <p>Aplikacja odczytuje kod i od razu otwiera ekran szczegółów rodziny.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Dotknij Nowy przegląd</strong>
              <p>Jesteś przy właściwej rodzinie i możesz zapisać wizytę.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-qr-batches.png" caption="Skanowanie kodu QR rodziny w terenie: rodzina otwiera się od razu" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Wskazówki</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Używaj etykiet odpornych na pogodę (polipropylen lub laminowany papier). Zwykłe papierowe etykiety szybko niszczeją na dworze, zwłaszcza w deszczu i pełnym słońcu.</p>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Każdy token QR można powiązać tylko z jedną rodziną. Jeśli musisz użyć etykiety ponownie (np. rodzina została podzielona), wygeneruj nową partię: stare tokeny pozostają przypisane do swojej pierwotnej rodziny.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Usuwanie partii kodów QR</h2>
        <p>
          Partię, której już nie potrzebujesz, można usunąć z listy partii kodów QR: ikoną kosza w serwisie, przyciskiem <em>Usuń</em> przy partii w aplikacjach. Działa to tylko wtedy, gdy żaden kod partii nie jest przypisany do rodziny. Skanowanie naklejki to sposób, w jaki rodzina jest odnajdywana, więc partia zostaje, dopóki te rodziny istnieją; przycisk usuwania nie jest wtedy dostępny.
        </p>
      </section>
    </>
  );
}
