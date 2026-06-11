import type HelpScreenshot from '@/components/HelpScreenshot';

export default function RemindersContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Que sont les rappels d'inspection ?</h2>
        <p>
          Les rappels d'inspection vous avertissent lorsqu'une ruche est en retard pour une visite selon votre intervalle choisi.
          Des inspections cohérentes sont la base d'une bonne gestion du varroa —
          les rappels vous aident à respecter le calendrier même pendant les semaines chargées.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p><strong>La livraison push arrive bientôt.</strong> Vous pouvez définir vos préférences maintenant et elles seront sauvegardées. Les notifications commenceront à arriver une fois l'infrastructure push activée.</p>
        </div>
        <Screenshot caption="Section Rappels d'inspection dans les Paramètres montrant la bascule et le sélecteur d'intervalle" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Configurer les rappels</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ouvrir les Paramètres</strong>
              <p>Appuyez sur l'onglet Paramètres dans la navigation inférieure sur iOS ou Android.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Faire défiler jusqu'aux Rappels d'inspection</strong>
              <p>Activez la bascule pour activer les rappels.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Définir l'intervalle de rappel</strong>
              <p>Choisissez combien de jours après la dernière inspection vous souhaitez être rappelé. Un choix courant est 7 jours en saison active.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Définir la fenêtre de saison</strong>
              <p>Choisissez les mois pendant lesquels les rappels doivent être actifs (ex. avril–septembre pour les climats tempérés). En dehors de cette fenêtre, aucun rappel n'est envoyé — il n'est pas nécessaire d'inspecter une colonie hivernée chaque semaine.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Appuyer sur Enregistrer les paramètres de rappel</strong>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Paramètres de rappel expliqués</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Intervalle de rappel</div>
            <div className="help-stat-card-desc">
              Nombre de jours après la dernière inspection avant qu'un rappel se déclenche.
              Choix courants : 7 jours (hebdomadaire) pour la gestion active du varroa, 14 jours pour
              les apiculteurs en intervention légère, 21–28 jours pour les apiculteurs naturels.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Début de saison</div>
            <div className="help-stat-card-desc">
              Le premier mois de la saison d'inspection active. Les rappels ne se déclencheront pas avant ce mois.
              En Europe du Nord, c'est typiquement avril ou mai.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Fin de saison</div>
            <div className="help-stat-card-desc">
              Le dernier mois de la saison active. Après ce mois, les rappels sont mis en sourdine
              jusqu'au début de la saison suivante. En Europe du Nord, c'est typiquement août ou septembre.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Conseils</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Définissez la fenêtre de saison pour correspondre à votre climat local — inutile d'être rappelé d'inspecter une colonie en hivernage.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Pendant la fenêtre critique de traitement varroa avant l'hiver (typiquement août–septembre), envisagez de raccourcir temporairement votre intervalle à 7 jours pour suivre les comptages d'acariens.</p>
        </div>
      </section>
    </>
  );
}
