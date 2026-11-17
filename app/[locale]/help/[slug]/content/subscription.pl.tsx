import type HelpScreenshot from '@/components/HelpScreenshot';

export default function SubscriptionContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Co jest bezpłatne</h2>
        <p>HivePulse jest bezpłatny do 10 rodzin pszczelich, przy dowolnej liczbie pasiek. Dziesięć obejmuje pszczelarza z kilkoma ulami za domem, którego nigdy nie powinno się prosić o pieniądze.</p>
        <p>Powyżej abonament Supporter kosztuje 19,99 € rocznie. Rok, a nie miesiąc, ponieważ pszczelarstwo jest sezonowe: niemal wszystko dzieje się między marcem a październikiem, a abonament miesięczny zachęcałby do rezygnacji każdej jesieni.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Czego osiągnięcie limitu nigdy nie robi</h2>
        <p><strong>Osiągnięcie limitu nigdy nie zamyka tego, co już jest.</strong></p>
        <p>Nic nie znika, nic nie staje się tylko do odczytu, nic nie jest usuwane. Zatrzymuje się wyłącznie dodanie jedenastej rodziny. Jeśli wykupisz abonament, urośniesz do piętnastu rodzin, a potem przestaniesz płacić — zachowujesz wszystkie piętnaście, możesz je dalej przeglądać i zachowujesz całą historię; po prostu nie dodasz szesnastej, dopóki abonament nie zacznie znowu działać.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Co obejmuje abonament</h2>
        <ul className="help-list">
          <li>Tyle rodzin pszczelich, ile prowadzisz.</li>
          <li>Zaproszenie kogoś do wspólnej pracy nad pasieką lub nad pojedynczą rodziną. Abonamentu potrzebuje ten, kto zaprasza; gość, który przyjmuje zaproszenie, nie.</li>
          <li>Własne pola przy rodzinach i przeglądach. Pola pasieki idą za abonamentem jej właściciela, aby mogły z nich korzystać wszystkie zaproszone osoby.</li>
          <li>Cała historia statystyk zamiast ostatniego roku oraz regionalna mapa zdrowia w sekcji Członkowie.</li>
        </ul>
        <p>Bezpłatne tak czy inaczej i takie mają pozostać: tropiciel szerszenia azjatyckiego, rok pszczelarski, kody QR i skanowanie, przeglądy zapisane bez zasięgu oraz eksport własnych danych. Statystyki są zawężane, a nie odmawiane — konto bezpłatne, które poprosi o całą historię, dostaje rok, a nie komunikat o błędzie.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Wykupienie abonamentu</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">W serwisie otwórz <strong>Panel → Abonament</strong>. Strona pokazuje, ile masz rodzin, co obejmuje abonament i czy coś już działa.</div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">Wybierz <strong>Wykup abonament</strong> i dokonaj płatności. Wszystko odblokowuje się zaraz po potwierdzeniu — w serwisie i w obu aplikacjach, bo abonament należy do konta, a nie do urządzenia.</div>
          </li>
        </ol>
        <p>Na razie abonament kupuje się w serwisie. W aplikacjach na iPhone’a i Androida zakup będzie przechodził przez App Store i Google Play, jak wymagają tego te sklepy — to jest właśnie budowane. Niezależnie od drogi zakupu abonament należy do twojego konta HivePulse i działa wszędzie, gdzie się zalogujesz; sam limit obowiązuje już na wszystkich trzech.</p>
        <Screenshot src="/docs/screenshots/subscription.png" caption="Strona Abonament: co masz, co obejmuje abonament i gdzie zrezygnować" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Rezygnacja — i co dzieje się potem</h2>
        <p>Abonament kupiony w App Store lub Google Play można anulować tylko tam — na iPhonie w Ustawieniach pod twoim imieniem, w Google Play w sekcji Płatności i subskrypcje. Ani aplikacja, ani serwis nie mogą go anulować; strona Abonament mówi to wprost i wskazuje właściwe miejsce. Abonament kupiony w serwisie anulujesz linkiem na tej samej stronie.</p>
        <p>Rezygnacja nie kończy go natychmiast: trwa do końca opłaconego okresu, a strona Abonament pokazuje tę datę. Potem znowu obowiązuje bezpłatny limit — i jak wyżej: wszystko, co zapisałeś, zostaje dokładnie tam, gdzie jest.</p>
      </section>
    </>
  );
}
