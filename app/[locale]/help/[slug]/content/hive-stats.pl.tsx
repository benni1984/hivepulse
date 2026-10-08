import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HiveStatsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Czym są statystyki rodziny?</h2>
        <p>
          Statystyki rodziny zamieniają historię przeglądów w wykresy i liczby podsumowujące, dzięki czemu
          łatwo zauważyć trendy, które umykają przy oglądaniu pojedynczych wpisów. Statystyki są dostępne na
          ekranie szczegółów rodziny na wszystkich platformach.
        </p>
        <Screenshot android="/docs/screenshots/android-hive-stats.png" web="/docs/screenshots/hive-stats-overview.png" caption="Strona statystyk rodziny z wykresem przebiegu Varroa i rozkładem temperamentu" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Filtr zakresu czasu</h2>
        <p>
          Wszystkie wykresy i liczby można filtrować według zakresu czasu: <strong>30 dni</strong>, <strong>90 dni</strong>,
          <strong>365 dni</strong> lub <strong>Cały czas</strong>. Krótsze zakresy pozwalają skupić się na bieżącym
          sezonie; Cały czas pokazuje pełną historię rodziny.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Każda statystyka po kolei</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-chart-line" style={{ marginRight: 6, color: '#f59e0b' }} />Przebieg Varroa</div>
            <div className="help-stat-card-desc">
              Wykres liniowy twoich wyników Varroa w czasie. Oś pozioma to data przeglądu, pionowa to
              roztocza na 100 pszczół. Patrz na nachylenie: rosnąca linia oznacza, że liczba roztoczy rośnie
              i wkrótce może być potrzebny zabieg.
            </div>
            <span className="help-stat-card-good">Cel: płaska linia w okolicy 0–2</span>{' '}
            <span className="help-stat-card-warn">Trend rosnący = pilnie leczyć</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-face-smile" style={{ marginRight: 6, color: '#22c55e' }} />Rozkład temperamentu</div>
            <div className="help-stat-card-desc">
              Wykres kołowy z udziałem przeglądów Spokojna, Nerwowa i Agresywna.
              Stała nerwowość lub agresja może wskazywać na bezmatek, chorobę lub kłopoty genetyczne,
              które uzasadniają wymianę matki.
            </div>
            <span className="help-stat-card-good">Cel: &gt;80% Spokojna</span>{' '}
            <span className="help-stat-card-warn">&gt;20% Agresywna = zbadać przyczynę</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-crown" style={{ marginRight: 6, color: '#eab308' }} />Odsetek widzianych matek</div>
            <div className="help-stat-card-desc">
              Odsetek przeglądów, w których na własne oczy zobaczono matkę. Stale niski
              odsetek może oznaczać, że matkę trudno dostrzec (normalne przy ciemnych matkach)
              albo że rodzina osierociała.
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-egg" style={{ marginRight: 6, color: '#8b5cf6' }} />Ramki z czerwiem</div>
            <div className="help-stat-card-desc">
              Średnia liczba ramek z czerwiem zapisana przy przeglądzie w wybranym okresie.
              Śledzi rozwój rodziny w sezonie: spodziewaj się wzrostu od wiosny, szczytu
              na początku lata i spadku jesienią.
            </div>
            <span className="help-stat-card-good">Szczyt sezonu: 6–9 ramek</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-clock" style={{ marginRight: 6, color: '#64748b' }} />Zdarzenia z matecznikami rojowymi</div>
            <div className="help-stat-card-desc">
              Liczba przeglądów, w których zgłoszono mateczniki rojowe. Wysoka liczba wskazuje na rodzinę
              skłonną do rójki, której mogą pomóc działania zapobiegające rójce (podział, więcej miejsca).
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-calendar" style={{ marginRight: 6, color: '#0ea5e9' }} />Przeglądy w okresie</div>
            <div className="help-stat-card-desc">
              Łączna liczba przeglądów zapisanych w wybranym zakresie czasu. Regularna częstotliwość przeglądów
              (co 7–14 dni w szczycie sezonu) daje najbardziej wiarygodne dane o trendach.
            </div>
          </div>
        </div>

        <Screenshot src="/docs/screenshots/hive-stats-overview.png" caption="Wykres liniowy przebiegu Varroa z datami przeglądów na osi poziomej" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Jak czytać przebieg Varroa i co robić</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Płaska linia w okolicy 0–1</div>
            <div className="help-stat-card-desc">Liczba roztoczy jest pod kontrolą. Kontynuuj regularne sprawdzanie co 3–4 tygodnie.</div>
            <span className="help-stat-card-good">Działanie niepotrzebne</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Powoli rosnąca (1–3)</div>
            <div className="help-stat-card-desc">Naturalny sezonowy wzrost. Sprawdzaj częściej (co 2 tygodnie) i zaplanuj zabieg, zanim wartość wzrośnie.</div>
            <span className="help-stat-card-warn">Obserwuj uważnie</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Powyżej 3 lub gwałtowny wzrost</div>
            <div className="help-stat-card-desc">Osiągnięto próg zabiegu. Natychmiast zastosuj dopuszczony zabieg przeciw Varroa. Nieleczone rodziny na tym poziomie zwykle giną przed zimą.</div>
            <span className="help-stat-card-warn">Leczyć natychmiast</span>
          </div>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Progi różnią się zależnie od kraju, sezonu i metody. Zawsze stosuj się do wytycznych dotyczących progów zabiegowych wydanych przez krajowy związek pszczelarski.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Wskazówki dla lepszych statystyk</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Statystyki znacznie zyskują dzięki regularnym danym. Nawet samo zapisywanie Varroa i temperamentu przy każdej wizycie daje sensowne linie trendu po czterech lub pięciu przeglądach.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Za każdym razem używaj tej samej metody próby. Przełączanie się w trakcie sezonu między przemywaniem cukrem a alkoholem utrudnia interpretację linii trendu.</p>
        </div>
      </section>
    </>
  );
}
