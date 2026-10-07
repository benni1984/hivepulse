import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HomeAndTreatmentsContent(_: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Votre journée en un coup d&rsquo;œil</h2>
        <p>
          Le haut de la liste des ruchers (et du tableau de bord sur le site) vous dit ce qui compte à l&rsquo;ouverture de
          HivePulse. Les ruches que d&rsquo;autres apiculteurs ont partagées avec vous sont incluses. Touchez une ruche pour
          l&rsquo;ouvrir.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>
            <strong>Prochaine visite.</strong> Une ruche est due quand votre intervalle de rappel s&rsquo;est écoulé depuis sa
            dernière visite (compté à partir du jour que vous avez saisi, pas du jour de la saisie). Vous voyez combien sont
            en retard et combien sont dues dans les trois prochains jours. Une ruche jamais visitée est due ce nombre de
            jours après sa création.
          </li>
          <li>
            <strong>État des ruches.</strong> En ordre, à surveiller, alerte ou inconnu, d&rsquo;après la dernière visite :
            <em> alerte</em> pour un varroa élevé, des cellules d&rsquo;essaimage ou une humeur agressive ; <em>à surveiller</em>
            pour un varroa moyen, une humeur nerveuse ou la reine non vue ; <em>inconnu</em> pour les ruches jamais visitées.
            Les ruches qui demandent de l&rsquo;attention sont listées avec la raison.
          </li>
          <li>
            <strong>Traitements à venir.</strong> Ce qui est prévu dans les 30 prochains jours, les retards d&rsquo;abord, chacun
            avec un bouton <em>Fait</em>.
          </li>
          <li>
            <strong>Une annonce.</strong> De temps en temps, une carte de notre part peut apparaître ici. Ce n&rsquo;est que du
            texte : pas de régie publicitaire, pas de suivi.
          </li>
        </ul>
        <p>
          L&rsquo;intervalle et la saison se règlent dans <em>Paramètres &rarr; Rappels de visites</em>. Hors saison, les dates sont
          calculées de la même façon et une note vous le signale.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Planifier un traitement</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ouvrir la ruche ou le rucher</strong>
              <p>Sur la page d&rsquo;une ruche, choisissez <em>Traitements</em>. Pour toutes les ruches d&rsquo;un rucher, utilisez l&rsquo;icône des traitements dans la barre du rucher.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Produit, jour et note facultative</strong>
              <p>Par exemple l&rsquo;acide oxalique le jour où vous comptez traiter. Touchez <em>Planifier un traitement</em>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Le marquer comme fait</strong>
              <p><em>Fait</em> sur l&rsquo;accueil ou dans la liste. Un traitement marqué par erreur peut être rouvert ; les derniers traitements faits sont listés en dessous.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            Planifier n&rsquo;est pas enregistrer. Ce que vous avez réellement appliqué s&rsquo;écrit toujours dans la visite
            (<em>traitement appliqué</em>). Quelqu&rsquo;un à qui on a donné quelques ruches peut planifier pour ces ruches, pas
            pour tout le rucher.
          </p>
        </div>
      </section>
    </>
  );
}
