import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HiveStatsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Que sont les statistiques de ruche ?</h2>
        <p>
          Les statistiques de ruche transforment votre historique d'inspection en graphiques et chiffres résumés, facilitant
          la détection de tendances que vous manqueriez en examinant des enregistrements individuels. Les statistiques sont disponibles sur l'écran de
          détail de la ruche sur toutes les plateformes.
        </p>
        <Screenshot caption="Page de statistiques de la ruche montrant le graphique de tendance varroa et la distribution des humeurs" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Filtre de période</h2>
        <p>
          Tous les graphiques et chiffres peuvent être filtrés par période : <strong>30 jours</strong>, <strong>90 jours</strong>,
          <strong>365 jours</strong>, ou <strong>Tout le temps</strong>. Utilisez des périodes plus courtes pour vous concentrer sur une saison en cours ;
          utilisez Tout le temps pour voir l'historique complet d'une colonie.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Chaque statistique expliquée</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-chart-line" style={{ marginRight: 6, color: '#f59e0b' }} />Tendance du comptage varroa</div>
            <div className="help-stat-card-desc">
              Un graphique en courbes de vos comptages varroa au fil du temps. L'axe x est la date d'inspection ; l'axe y
              est les acariens pour 100 abeilles. Regardez la pente : une ligne montante signifie que la charge en acariens augmente
              et qu'un traitement pourrait être nécessaire prochainement.
            </div>
            <span className="help-stat-card-good">Objectif : ligne plate proche de 0–2</span>{' '}
            <span className="help-stat-card-warn">Tendance montante = traiter d'urgence</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-face-smile" style={{ marginRight: 6, color: '#22c55e' }} />Distribution des humeurs</div>
            <div className="help-stat-card-desc">
              Un graphique en anneau montrant la proportion d'inspections Calme, Nerveuse et Agressive.
              La nervosité ou l'agressivité persistante peut indiquer une absence de reine, une maladie ou des problèmes génétiques
              nécessitant un remplacement de reine.
            </div>
            <span className="help-stat-card-good">Objectif : &gt;80% Calme</span>{' '}
            <span className="help-stat-card-warn">&gt;20% Agressive = investiguer</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-crown" style={{ marginRight: 6, color: '#eab308' }} />Taux de reine vue</div>
            <div className="help-stat-card-desc">
              Pourcentage d'inspections où vous avez visuellement confirmé la présence de la reine. Un taux constamment bas
              peut signifier que la reine est difficile à repérer (normal pour les reines sombres) ou que la colonie
              est devenue sans reine.
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-egg" style={{ marginRight: 6, color: '#8b5cf6' }} />Cadres de couvain</div>
            <div className="help-stat-card-desc">
              Nombre moyen de cadres de couvain enregistrés par inspection dans la période sélectionnée.
              Suit la croissance de la colonie au cours de la saison — vous attendez une hausse au printemps, un pic en
              début d'été, puis un déclin en automne.
            </div>
            <span className="help-stat-card-good">Pleine saison : 6–9 cadres</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-clock" style={{ marginRight: 6, color: '#64748b' }} />Événements de cellules d'essaimage</div>
            <div className="help-stat-card-desc">
              Nombre d'inspections où des cellules d'essaimage ont été signalées. Un nombre élevé indique une
              colonie sujette à l'essaimage qui pourrait bénéficier d'une gestion anti-essaimage (division, fourniture de plus d'espace).
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-calendar" style={{ marginRight: 6, color: '#0ea5e9' }} />Inspections par période</div>
            <div className="help-stat-card-desc">
              Nombre total d'inspections enregistrées dans la période sélectionnée. Une fréquence d'inspection cohérente
              (tous les 7–14 jours en pleine saison) donne les données de tendances les plus fiables.
            </div>
          </div>
        </div>

        <Screenshot caption="Graphique en courbes de tendance varroa avec les dates d'inspection sur l'axe x" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Lire la tendance varroa — que faire</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Ligne plate proche de 0–1</div>
            <div className="help-stat-card-desc">La charge en acariens est sous contrôle. Continuer la surveillance régulière toutes les 3–4 semaines.</div>
            <span className="help-stat-card-good">Aucune action requise</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Montée lente (1–3)</div>
            <div className="help-stat-card-desc">Augmentation saisonnière naturelle. Surveiller plus fréquemment (toutes les 2 semaines) et planifier le traitement avant qu'elle monte davantage.</div>
            <span className="help-stat-card-warn">Surveiller de près</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Au-dessus de 3 ou montée abrupte</div>
            <div className="help-stat-card-desc">Seuil de traitement atteint. Appliquer immédiatement un traitement varroa approuvé. Les colonies non traitées à ce niveau s'effondrent typiquement avant l'hiver.</div>
            <span className="help-stat-card-warn">Traiter immédiatement</span>
          </div>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Les seuils varient selon le pays, la saison et la méthode. Suivez toujours les directives de votre association apicole nationale pour les seuils de traitement.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Conseils pour de meilleures statistiques</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Les statistiques s'améliorent considérablement avec des données cohérentes. Même en enregistrant juste le comptage varroa et l'humeur à chaque visite, vous obtenez des courbes de tendances significatives après quatre ou cinq inspections.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Utilisez la même méthode d'échantillonnage à chaque fois. Alterner entre lavage au sucre et à l'alcool en milieu de saison rend la courbe de tendance plus difficile à interpréter.</p>
        </div>
      </section>
    </>
  );
}
