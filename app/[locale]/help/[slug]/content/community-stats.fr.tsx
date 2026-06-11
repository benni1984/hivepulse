import type HelpScreenshot from '@/components/HelpScreenshot';

export default function CommunityStatsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Que sont les statistiques communautaires ?</h2>
        <p>
          Les statistiques communautaires affichent des chiffres agrégés à l'échelle de la plateforme calculés à partir de tous les ruchers publics
          sur HivePulse. Elles vous permettent de comparer les performances de vos ruches avec les apiculteurs de la
          communauté plus large sans exposer les données individuelles de quiconque.
        </p>
        <p>
          L'écran des statistiques communautaires est disponible sous <strong>Membres</strong> sur toutes les plateformes.
          Les quatre cartes de statistiques en direct sont visibles par tous ; la ventilation détaillée est une
          <strong> fonctionnalité Supporter</strong>.
        </p>
        <Screenshot caption="Écran Membres montrant les quatre cartes de statistiques communautaires" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Les quatre statistiques communautaires expliquées</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Comptage varroa moyen</div>
            <div className="help-stat-card-desc">
              Le comptage varroa moyen (acariens pour 100 abeilles) dans toutes les inspections publiques qui
              ont enregistré une mesure varroa. Vous donne un référentiel régional : si votre comptage est
              constamment supérieur à la moyenne communautaire, votre colonie pourrait avoir besoin d'un traitement plus tôt
              que la normale dans votre région.
            </div>
            <span className="help-stat-card-good">Moy. communautaire sous 2 = saison saine</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">% Bonne humeur</div>
            <div className="help-stat-card-desc">
              Pourcentage d'inspections dans tous les ruchers publics évalués comme « Calme ». Un taux calme
              communautaire élevé suggère une bonne génétique régionale et des conditions de faible stress
              (bonne floraison, faible pression des ravageurs). Une tendance à la baisse du taux de bonne humeur peut signaler une saison difficile
              pour les abeilles dans votre région.
            </div>
            <span className="help-stat-card-good">Au-dessus de 75% = une saison calme à l'échelle communautaire</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Cadres de couvain moyens</div>
            <div className="help-stat-card-desc">
              Nombre moyen de cadres de couvain enregistrés dans toutes les inspections publiques. Au printemps,
              ce chiffre monte ; en automne il descend. Comparer votre nombre de cadres de couvain à cette
              moyenne peut révéler si vos colonies se développent plus vite ou plus lentement que les autres
              dans la communauté.
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Intervalle d'inspection moyen</div>
            <div className="help-stat-card-desc">
              Nombre moyen de jours entre inspections consécutives, moyenné par ruche dans tous les
              ruchers publics. Des intervalles plus courts signifient des apiculteurs plus attentifs — et plus de données
              pour l'analyse de tendances. La moyenne communautaire vous donne une idée des habitudes d'inspection locales.
            </div>
            <span className="help-stat-card-good">7–14 jours en saison active</span>
          </div>
        </div>
        <Screenshot caption="Les quatre cartes de statistiques avec des données communautaires en direct" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Contribuer aux statistiques communautaires</h2>
        <p>
          Vos inspections contribuent automatiquement aux statistiques communautaires lorsque votre rucher est défini
          comme <strong>public</strong>. Aucune action supplémentaire n'est requise. Les enregistrements individuels ne sont
          jamais visibles par les autres utilisateurs — seuls les agrégats (moyennes, pourcentages) sont publiés.
        </p>
        <p>
          Pour rendre un rucher public, ouvrez sa page de détail et activez <em>Rendre public</em>.
          Vous pouvez revenir à privé à tout moment.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Devenir Supporter</h2>
        <p>
          La ventilation détaillée de la communauté — graphiques de tendances, ventilations régionales, ruchers
          les plus performants — est débloquée pour les Supporters HivePulse. Devenir Supporter aide également à maintenir
          la plateforme en fonctionnement et gratuite pour tous les apiculteurs.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>L'achat intégré Supporter arrive bientôt. En attendant, visitez la <a href="/contribute">page Contribuer</a> pour savoir comment soutenir le projet.</p>
        </div>
      </section>
    </>
  );
}
