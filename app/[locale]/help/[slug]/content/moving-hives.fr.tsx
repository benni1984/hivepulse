import type HelpScreenshot from '@/components/HelpScreenshot';

export default function MovingHivesContent(_: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Emmener les ruches à la floraison</h2>
        <p>
          Les apiculteurs transhumants emmènent leurs ruches là où quelque chose fleurit : acacia, colza, sapin, bruyère.
          Le déplacement se fait en une seule action : vous choisissez les ruches, le nouveau lieu, le jour et la miellée.
          Chaque déplacement est conservé, vous voyez donc toujours où une ruche a été et quand.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Déplacer des ruches</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ouvrir le rucher où se trouvent les ruches</strong>
              <p>Touchez <em>Déplacer des ruches</em> (les deux flèches dans la barre du haut ; sur le site, le bouton de la page du rucher).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Choisir les ruches</strong>
              <p>Une par une, ou toutes avec <em>Toutes les ruches</em>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Choisir la destination</strong>
              <p>
                Un de vos autres ruchers, ou <em>Un nouveau lieu</em> avec un nom et une adresse. HivePulse recherche
                l&rsquo;adresse pour que le lieu puisse être placé sur la carte.
              </p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Jour, miellée et note</strong>
              <p>Le jour est aujourd&rsquo;hui si vous ne le changez pas (pas dans le futur). Choisissez une miellée ou écrivez la vôtre, et ajoutez une note si vous le souhaitez.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            <strong>Retour d&rsquo;où elles venaient.</strong> Si des ruches ont déjà été amenées à ce rucher, des boutons comme
            &laquo;&nbsp;Retour à Champ (3)&nbsp;&raquo; apparaissent en haut du formulaire. Un geste sélectionne ces ruches et
            leur lieu précédent ; vous ne confirmez plus que le jour.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Où une ruche a été</h2>
        <p>
          Chaque page de ruche affiche <em>Où cette ruche a été</em> : son parcours sur une carte et la liste de ses
          déplacements. La <em>Carte des déplacements</em> (l&rsquo;icône de carte dans la barre de la liste des ruchers, ou dans
          le menu du tableau de bord sur le site) dessine le parcours de chaque ruche, numéroté étape par étape, et peut
          être limitée à une période.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Bon à savoir</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Seul le propriétaire d&rsquo;un rucher peut en déplacer les ruches.</li>
          <li>Une ruche garde son QR code et toutes ses visites quand elle est déplacée.</li>
          <li>Un rucher vide reste ; il attend la saison suivante.</li>
          <li>Déplacer à l&rsquo;intérieur du même rucher n&rsquo;est pas possible, il n&rsquo;y a rien à déplacer.</li>
          <li>Pour la carte, les deux lieux ont besoin de coordonnées ou d&rsquo;une adresse.</li>
        </ul>
      </section>
    </>
  );
}
