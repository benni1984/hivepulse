import type HelpScreenshot from '@/components/HelpScreenshot';

export default function SharingContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Wspólna praca nad pasieką</h2>
        <p>
          Dwóch pszczelarzy może razem opiekować się tą samą pasieką albo pojedynczymi rodzinami. Zapraszasz drugą
          osobę adresem e-mail; gdy przyjmie zaproszenie, oboje widzicie te same rodziny i przeglądy i oboje możecie
          zapisywać przeglądy, edytować rodziny i dodawać rodziny.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            <strong>Co zostaje przy właścicielu.</strong> Osoba, która założyła pasiekę, jest jej właścicielem. Tylko właściciel może
            usunąć pasiekę lub rodzinę, upublicznić pasiekę na mapie społeczności, przewozić rodziny oraz zapraszać i usuwać
            osoby. Współpracownik zawsze może odejść.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Udostępnij całą pasiekę albo pojedyncze rodziny</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Pasieka</strong> udostępnia pasiekę i każdą rodzinę w niej, także rodziny dodane później.</li>
          <li>
            <strong>Pojedyncza rodzina</strong> udostępnia tylko tę rodzinę. Druga osoba widzi nazwę jej pasieki, żeby
            się zorientować, ale żadnej z innych rodzin w niej, i nie może edytować pasieki ani dodawać do niej rodzin.
          </li>
        </ul>
        <p>Aby udostępnić część rodzin pasieki, a nie wszystkie, przenieś je do osobnej pasieki i udostępnij ją.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zaproś kogoś</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Otwórz pasiekę lub rodzinę</strong>
              <p>W serwisie użyj <em>Pracujcie razem</em> na stronie; w aplikacjach dotknij ikony osób na pasku narzędzi.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Wpisz adres e-mail i wyślij</strong>
              <p>Zaproszenie pozostaje <em>oczekujące</em>, dopóki nie zostanie przyjęte. Możesz je wycofać z tego samego ekranu.</p>
            </div>
          </li>
        </ol>
        <Screenshot android="/docs/screenshots/android-sharing.png" web="/docs/screenshots/sharing-panel.png" caption="Zaproś innego pszczelarza e-mailem" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Przyjmij zaproszenie</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>
            <strong>Masz już konto</strong> z tym adresem: zaproszenie pojawia się na górze listy
            pasiek z przyciskami <em>Przyjmij</em> i <em>Odrzuć</em>. E-mail również cię o tym informuje.
          </li>
          <li>
            <strong>Nie masz jeszcze konta:</strong> e-mail zawiera link. Otwórz go, zarejestruj się lub zaloguj
            tym adresem i przyjmij zaproszenie. Jeśli logujesz się przez Apple lub Google, zaproszenie już czeka na liście
            pasiek, a ty tylko dotykasz <em>Przyjmij</em>. Jeśli w aplikacji zarejestrowano się hasłem, przewiń na koniec
            listy pasiek, dotknij <em>Użyj linku z zaproszenia</em> i wklej link.
          </li>
        </ul>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zakończenie współpracy</h2>
        <p>
          Właściciel usuwa osobę na tym samym ekranie <em>Pracujcie razem</em>; pasieka lub rodzina od razu znika z listy
          drugiej osoby. Współpracownik może odejść ze swojej strony. Przeglądy zapisane przez ciebie zostają
          przy rodzinie.
        </p>
      </section>
    </>
  );
}
