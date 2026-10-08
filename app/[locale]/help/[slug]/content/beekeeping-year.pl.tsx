import type HelpScreenshot from '@/components/HelpScreenshot';

export default function BeekeepingYearContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Co pokazuje oś czasu</h2>
        <p>
          Rok pszczelarski to oś czasu tego, co pszczelarz robi i kiedy, miesiąc po miesiącu: karmienie ciastem
          cukrowym w lutym, pierwsze przeglądy, kontrola rójki co tydzień, a najpóźniej co 9 dni, ramki trutowe
          przeciw Varroa, kiedy przewozić na jaki miód i kiedy go odwirować, oraz przygotowanie do zimy
          z zabiegiem przeciw Varroa i karmieniem.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Jest niekończąca się: przewijaj w górę i w dół, rok się powtarza.</li>
          <li>Otwiera się na dzisiejszym dniu. To, co dzieje się teraz, jest oznaczone <em>Teraz</em>, a linia pokazuje, gdzie wypada dzisiaj.</li>
          <li>Zadanie, które się powtarza, mówi, jak często, na przykład <em>Najpóźniej co 9 dni</em> przy kontroli rójki.</li>
          <li>Zadanie dotyczące jednego rodzaju miodu to pokazuje, na przykład rzepak lub akację.</li>
        </ul>
        <p>
          Znajdziesz go w menu panelu w serwisie (<em>Rok pszczelarski</em>) i na pasku narzędzi listy pasiek
          w obu aplikacjach (ikona kalendarza).
        </p>
        <Screenshot android="/docs/screenshots/android-beekeeping-year.png" web="/docs/screenshots/beekeeping-year.png" caption="Rok pszczelarski otwarty na dzisiejszym dniu" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Ustaw swój region</h2>
        <p>
          Terminy są zapisane dla środkowych Niemiec. Przyroda budzi się wcześniej na południu i później na północy, więc
          mówisz HivePulse, gdzie trzymasz pszczoły, a terminy się przesuwają: o około cztery dni na stopień szerokości
          geograficznej, więc rodzina pod Hamburgiem kwitnie około dwóch tygodni później niż pod Frankfurtem.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Otwórz region</strong>
              <p>W serwisie: <em>Profil</em>, karta <em>Region dla roku pszczelarskiego</em>. W aplikacjach: <em>Ustawienia &rarr; Region</em> albo <em>Ustaw region</em> na osi czasu.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Wybierz kraj i wpisz kod pocztowy</strong>
              <p>HivePulse wyszukuje kod pocztowy jednorazowo i zachowuje tylko pozycję, nie adres.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>W razie potrzeby popraw ręcznie</strong>
              <p>Dolina górska jest później, osłonięty ogród wcześniej. Dodaj lub odejmij do 28 dni.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            Bez regionu oś czasu używa pozycji twojej pierwszej pasieki, a bez niej terminów dla
            środkowych Niemiec. Linia nad osią czasu mówi, co z tego i o ile dni przesuwa terminy.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Miód: kiedy przewozić, kiedy odwirować</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Rzepak:</strong> przewóz na początku kwitnienia, miodobranie od razu po jego końcu (krystalizuje w ciągu kilku dni).</li>
          <li><strong>Akacja:</strong> kwitnienie trwa około dziesięciu dni, więc przewóz dokładnie wtedy; miód długo pozostaje płynny.</li>
          <li><strong>Lipa:</strong> od końca czerwca; odwiruj, gdy dwie trzecie jest zasklepione, a woda wynosi 18 % lub mniej.</li>
          <li><strong>Jodła i świerk (spadź):</strong> przewoź dopiero po potwierdzeniu pożytku; odwiruj w cieple i na czas, zanim skrystalizuje w plastrach.</li>
          <li><strong>Kasztan jadalny, lawenda, słonecznik:</strong> na południu i w ciepłe lata; słonecznik krystalizuje bardzo szybko.</li>
          <li><strong>Wrzos:</strong> od sierpnia; miód jest galaretowaty i wyciska się go, a nie odwirowuje.</li>
        </ul>
        <p>
          Miód jest dojrzały, gdy plastry są zasklepione mniej więcej w dwóch trzecich (próba strząsania: nic nie pryska), a zawartość
          wody wynosi 18 % lub mniej, mierzona refraktometrem.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Warto wiedzieć</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Terminy to wartości orientacyjne z zasad dobrej praktyki pszczelarskiej, nie przepisy: decydują kwitnienie i pogoda.</li>
          <li>Leki tylko takie, jakie są dopuszczone i zalecone w twoim kraju; w razie wątpliwości zapytaj swój związek pszczelarzy lub urząd weterynaryjny.</li>
          <li>Podejrzenie zgnilca trzeba zgłosić organowi weterynaryjnemu.</li>
          <li>Teksty są w języku aplikacji: angielskim, niemieckim, francuskim, hiszpańskim i polskim.</li>
        </ul>
      </section>
    </>
  );
}
