import type HelpScreenshot from '@/components/HelpScreenshot';

export default function CommunityStatsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Czym są statystyki społeczności?</h2>
        <p>
          Statystyki społeczności pokazują zbiorcze liczby całej platformy, obliczone ze wszystkich pasiek
          publicznych w HivePulse. Pozwalają porównać wyniki swoich rodzin z pszczelarzami ze
          społeczności bez ujawniania czyichkolwiek pojedynczych danych.
        </p>
        <p>
          Ekran statystyk społeczności znajduje się w zakładce <strong>Członkowie</strong> na wszystkich platformach.
          Cztery karty ze statystykami na żywo widzi każdy; szczegółowe zestawienie to
          <strong> funkcja dla wspierających</strong>.
        </p>
        <Screenshot src="/docs/screenshots/android-community-stats.png" caption="Ekran Członkowie z czterema kartami statystyk społeczności" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Cztery statystyki społeczności</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Śr. Varroa</div>
            <div className="help-stat-card-desc">
              Średnia liczba Varroa (roztocza na 100 pszczół) ze wszystkich publicznych przeglądów, w których
              zapisano pomiar Varroa. Daje regionalny punkt odniesienia: jeśli twój wynik jest
              stale wyższy od średniej społeczności, twoja rodzina może potrzebować zabiegu wcześniej
              niż typowo w twojej okolicy.
            </div>
            <span className="help-stat-card-good">Średnia społeczności poniżej 2 = zdrowy sezon</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Odsetek dobrego temperamentu</div>
            <div className="help-stat-card-desc">
              Odsetek przeglądów we wszystkich pasiekach publicznych ocenionych jako „Spokojna”. Wysoki
              odsetek spokojnych rodzin w społeczności sugeruje dobrą genetykę regionalną i niski stres
              (dobry pożytek, niska presja szkodników). Spadający trend może zapowiadać trudny
              sezon dla pszczół w twoim regionie.
            </div>
            <span className="help-stat-card-good">Powyżej 75% = spokojny sezon w całej społeczności</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Śr. liczba ramek z czerwiem</div>
            <div className="help-stat-card-desc">
              Średnia liczba ramek z czerwiem ze wszystkich publicznych przeglądów. Wiosną ta liczba
              rośnie, jesienią spada. Porównanie twojej liczby ramek z czerwiem z tą średnią
              może pokazać, czy twoje rodziny rozwijają się szybciej czy wolniej niż inne
              w społeczności.
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Śr. odstęp między przeglądami</div>
            <div className="help-stat-card-desc">
              Średnia liczba dni między kolejnymi przeglądami, uśredniona dla rodziny we wszystkich
              pasiekach publicznych. Krótsze odstępy oznaczają bardziej uważnych pszczelarzy i więcej danych
              do analizy trendów. Średnia społeczności daje wyobrażenie o lokalnych zwyczajach przeglądów.
            </div>
            <span className="help-stat-card-good">7–14 dni w aktywnym sezonie</span>
          </div>
        </div>
        <Screenshot src="/docs/screenshots/android-community-stats.png" caption="Cztery karty statystyk z danymi społeczności na żywo" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Wkład w statystyki społeczności</h2>
        <p>
          Twoje przeglądy zasilają statystyki społeczności automatycznie, gdy pasieka jest ustawiona
          jako <strong>publiczna</strong>. Nie trzeba nic więcej robić. Pojedyncze wpisy nigdy nie są
          widoczne dla innych użytkowników; publikowane są tylko zbiorcze wartości (średnie, odsetki).
        </p>
        <p>
          Aby upublicznić pasiekę, otwórz jej stronę szczegółów i włącz <em>Uczyń publiczną</em>.
          W każdej chwili możesz wrócić do trybu prywatnego.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Zostań wspierającym</h2>
        <p>
          Szczegółowe zestawienie społeczności (wykresy trendów, zestawienia regionalne, najlepsze
          pasieki) jest odblokowane dla wspierających HivePulse. Wsparcie pomaga też utrzymać
          platformę przy życiu i darmową dla wszystkich pszczelarzy.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Zakup statusu wspierającego w aplikacji będzie dostępny wkrótce. Do tego czasu odwiedź <a href="/contribute">stronę Zaangażuj się</a>, aby dowiedzieć się, jak wesprzeć projekt.</p>
        </div>
      </section>
    </>
  );
}
