import type HelpScreenshot from '@/components/HelpScreenshot';

export default function BeekeepingYearContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Ce que montre la frise</h2>
        <p>
          L&rsquo;année apicole est une frise de ce qu&rsquo;un apiculteur fait et quand, mois par mois : nourrir au candi en
          février, les premières visites, le contrôle de l&rsquo;essaimage chaque semaine et au plus tard tous les 9 jours,
          les cadres à mâles contre le varroa, quand déplacer pour quel miel et quand l&rsquo;extraire, et la préparation de
          l&rsquo;hiver avec le traitement contre le varroa et le nourrissement.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Elle est sans fin : faites défiler vers le haut et le bas, l&rsquo;année se répète.</li>
          <li>Elle s&rsquo;ouvre à aujourd&rsquo;hui. Ce qui est en cours est marqué <em>Maintenant</em>, et une ligne montre où tombe aujourd&rsquo;hui.</li>
          <li>Une tâche qui se répète dit à quelle fréquence, par exemple <em>Au plus tard tous les 9 jours</em> pour le contrôle de l&rsquo;essaimage.</li>
          <li>Une tâche liée à un miel l&rsquo;indique, par exemple colza ou acacia.</li>
        </ul>
        <p>
          Vous la trouvez dans le menu du tableau de bord sur le site (<em>Année apicole</em>) et dans la barre de la liste
          des ruchers dans les deux applications (l&rsquo;icône de calendrier).
        </p>
        <Screenshot android="/docs/screenshots/android-beekeeping-year.png" web="/docs/screenshots/beekeeping-year.png" caption="L’année apicole, ouverte à aujourd’hui" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Indiquer votre région</h2>
        <p>
          Les dates sont écrites pour le centre de l&rsquo;Allemagne. La nature est plus précoce au sud et plus tardive au
          nord ; vous indiquez donc à HivePulse où sont vos abeilles et les dates se décalent : environ quatre jours par
          degré de latitude, une colonie près de Hambourg fleurit donc environ deux semaines plus tard qu&rsquo;une près de
          Francfort.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ouvrir la région</strong>
              <p>Sur le site : <em>Profil</em>, carte <em>Région pour l&rsquo;année apicole</em>. Dans les applications : <em>Paramètres &rarr; Région</em>, ou <em>Indiquer la région</em> sur la frise.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Choisir le pays et saisir le code postal</strong>
              <p>HivePulse recherche le code postal une fois et ne garde que la position, pas l&rsquo;adresse.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Ajuster à la main si vous le souhaitez</strong>
              <p>Une vallée de montagne est plus tardive, un jardin abrité plus précoce. Ajoutez ou retirez jusqu&rsquo;à 28 jours.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            Sans région, la frise utilise la position de votre premier rucher, et sans elle les dates du centre de
            l&rsquo;Allemagne. Une ligne au-dessus de la frise dit laquelle, et de combien de jours elle décale les dates.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Miel : quand déplacer, quand extraire</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Colza :</strong> déplacer au début de la floraison, extraire aussitôt à la fin (il durcit en quelques jours).</li>
          <li><strong>Acacia :</strong> une floraison d&rsquo;une dizaine de jours, donc déplacer juste à ce moment ; le miel reste longtemps liquide.</li>
          <li><strong>Tilleul :</strong> à partir de fin juin ; extraire quand les deux tiers sont operculés et que l&rsquo;eau est à 18 % ou moins.</li>
          <li><strong>Sapin et épicéa (miellat) :</strong> ne déplacer que si la miellée est confirmée ; extraire tiède et à temps, avant qu&rsquo;il ne se fige dans le rayon.</li>
          <li><strong>Châtaignier, lavande, tournesol :</strong> dans le sud et les étés chauds ; le tournesol cristallise très vite.</li>
          <li><strong>Bruyère :</strong> à partir d&rsquo;août ; le miel est gélifié et se presse, il ne s&rsquo;extrait pas.</li>
        </ul>
        <p>
          Un miel est mûr quand les rayons sont operculés aux deux tiers environ (test de secouage : rien ne gicle) et que
          la teneur en eau est de 18 % ou moins, mesurée au réfractomètre.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Bon à savoir</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Les dates sont des valeurs indicatives tirées de la pratique apicole habituelle, pas des règles : la floraison et la météo décident.</li>
          <li>Médicaments uniquement selon l&rsquo;autorisation et les règles de votre pays ; en cas de doute, demandez à votre syndicat apicole ou à l&rsquo;autorité vétérinaire.</li>
          <li>Un soupçon de loque doit être déclaré à l&rsquo;autorité vétérinaire.</li>
          <li>Les textes sont dans la langue de l&rsquo;application : anglais, allemand, français, espagnol et polonais.</li>
        </ul>
      </section>
    </>
  );
}
