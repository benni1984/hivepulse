import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HornetTrapsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Czym jest nazwana pułapka?</h2>
        <p>
          Nazwana pułapka to fizyczna pułapka na szerszenie azjatyckie zarejestrowana w HivePulse.
          Każda pułapka dostaje <strong>8-znakowy kod dostępu</strong>. Każdy, kto zna kod (ty,
          sąsiad, wolontariusz, badacz terenowy), może zapisywać dzienne odłowy tej
          pułapki bez konta HivePulse.
        </p>
        <p>
          Nazwane pułapki ułatwiają prowadzenie rozproszonych sieci monitoringu: zarejestruj pułapki w
          wielu miejscach, przekaż kody dostępu lokalnym związkom pszczelarzy i
          zbieraj dane o odłowach od społeczności.
        </p>
        <Screenshot src="/docs/screenshots/android-hornet-traps.png" caption="Ekran szczegółów pułapki z kodem dostępu, historią odłowów i przyciskiem zapisu odłowu" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Rejestrowanie pułapki</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Przejdź do Szerszenie → Pułapki</strong>
              <p>W serwisie przejdź do <strong>/hornets/traps</strong> albo w aplikacji otwórz ekran Pułapki na szerszenie.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Dotknij Zarejestruj nową pułapkę</strong>
              <p>Wpisz nazwę (np. „Płot północny”), współrzędne GPS i opcjonalny opis.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Zapisz</strong>
              <p>Pułapka zostaje zarejestrowana i generowany jest 8-znakowy kod dostępu. Zapisz go lub przekaż dalej.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-hornet-traps.png" caption="Formularz rejestracji pułapki z nazwą, GPS i wygenerowanym kodem dostępu" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zapisywanie dziennego odłowu</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Wpisz kod dostępu</strong>
              <p>Na stronie Pułapki wpisz 8-znakowy kod w polu wyszukiwania. Pułapka otwiera się bez logowania.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Dotknij Zapisz dzisiejszy odłów</strong>
              <p>Wpisz liczbę szerszeni złapanych od ostatniej kontroli.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Zapisz</strong>
              <p>Dla jednej pułapki przechowywany jest tylko jeden odłów dziennie: ponowne wysłanie dzisiaj aktualizuje istniejący wpis.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Szukanie pułapek w pobliżu</h2>
        <p>
          Karta <strong>W pobliżu</strong> na stronie Pułapki pokazuje zarejestrowane pułapki w promieniu 50 metrów
          od twojej bieżącej lokalizacji GPS. Przydaje się w terenie, gdy chcesz zapisać
          odłów pułapki, którą prowadzisz, ale nie pamiętasz jej kodu dostępu.
        </p>
        <Screenshot src="/docs/screenshots/android-hornet-traps.png" caption="Lista pułapek w pobliżu z dwiema pułapkami w promieniu 50 m i odległościami" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Mapa pułapek</h2>
        <p>
          Wszystkie zarejestrowane pułapki pojawiają się jako niebieskie pinezki na mapie szerszeni pod adresem <strong>/hornets/map</strong>.
          Daje to lokalnym związkom pszczelarzy przegląd luk w pokryciu: obszarów bez pułapek
          i z dużym zagęszczeniem gniazd, którym przydałaby się nowa pułapka.
        </p>
      </section>
    </>
  );
}
