import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HornetTrackerContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Pourquoi suivre les frelons asiatiques ?</h2>
        <p>
          <em>Vespa velutina</em> (le frelon asiatique) est un prédateur invasif qui chasse les abeilles mellifères
          aux entrées des ruches, réduisant considérablement l'activité de butinage et la force des colonies. La détection précoce et
          la destruction des nids sont les mesures de contrôle les plus efficaces. Le Suivi des Frelons de HivePulse
          permet à tout citoyen — sans compte requis — de contribuer des observations, et permet aux apiculteurs
          de surveiller la densité des nids dans leur région.
        </p>
        <Screenshot src="/docs/screenshots/android-hornet-home.png" caption="Page d'accueil du Suivi des Frelons montrant les statistiques agrégées et les liens d'action" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Signaler une capture</h2>
        <p>
          Une « capture » est le nombre de frelons capturés dans un piège sur une période de temps.
          Les signalements ne nécessitent pas de compte.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Aller à Frelons → Signaler</strong>
              <p>Naviguez vers <strong>/hornets/report</strong> sur le web.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Saisir votre nombre de captures et localisation optionnelle</strong>
              <p>Ajouter des coordonnées GPS place votre capture sur la carte, aidant les autorités à suivre les schémas de propagation.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Soumettre</strong>
              <p>Votre signalement est ajouté immédiatement au total des captures communautaires.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-hornet-report.png" caption="Formulaire de signalement de capture avec saisie du nombre et champs GPS optionnels" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Signaler un nid</h2>
        <p>
          Les signalements de nids incluent une localisation GPS et un statut actuel (Trouvé / Destruction ordonnée / Détruit).
          Les nids confirmés apparaissent comme des épingles rouges sur la carte des Frelons.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Aller à Frelons → Signaler</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Passer à l'onglet Nid</strong>
              <p>Saisir la latitude, la longitude et le statut du nid.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Soumettre</strong>
              <p>Le nid apparaît sur la carte pour les autres apiculteurs et les autorités locales.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Observations photo &amp; vote communautaire</h2>
        <p>
          Le fil d'observations communautaires permet aux utilisateurs de soumettre une photo d'un frelon asiatique suspecté
          pour vérification par d'autres. Les erreurs d'identification sont courantes (les frelons asiatiques sont souvent confondus
          avec les frelons européens et les syrphes), donc le vote communautaire aide à filtrer les signalements précis.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Aller à Frelons → Observations communautaires</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Parcourir le fil</strong>
              <p>Chaque carte affiche la photo, la date de soumission et le nombre actuel de votes Oui/Non.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Voter Oui ou Non</strong>
              <p>Donnez un vote par observation. Les admins peuvent remplacer le statut par Confirmé ou Rejeté.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Soumettre votre propre photo</strong>
              <p>Appuyez sur le bouton +, téléchargez une photo et ajoutez des données de localisation optionnelles.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-hornet-community.png" caption="Fil d'observations communautaires montrant des cartes photo avec des comptages de votes" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Lire les statistiques</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Total capturé</div>
            <div className="help-stat-card-desc">Tous les frelons signalés comme capturés dans tous les signalements de pièges à l'échelle de la plateforme. Un total croissant signale une saison active.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Nids trouvés</div>
            <div className="help-stat-card-desc">Nombre de signalements de nids soumis. Un nombre élevé de nids dans votre région signifie un risque de prédation plus élevé dans votre rucher.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Nids détruits</div>
            <div className="help-stat-card-desc">Nids avec le statut « Détruit ». Suit l'efficacité des efforts de contrôle locaux.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Observations en attente</div>
            <div className="help-stat-card-desc">Observations photo communautaires en attente de suffisamment de votes pour confirmer ou rejeter. Aidez à réduire ce nombre en votant sur les observations ouvertes.</div>
          </div>
        </div>
      </section>
    </>
  );
}
