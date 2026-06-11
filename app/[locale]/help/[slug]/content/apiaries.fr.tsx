import type HelpScreenshot from '@/components/HelpScreenshot';

export default function AviariesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Qu'est-ce qu'un rucher ?</h2>
        <p>
          Un rucher est un emplacement nommé qui regroupe une ou plusieurs ruches. Il représente
          un lieu physique — votre jardin, un champ, un toit — où vivent vos colonies.
          Chaque ruche dans HivePulse appartient à exactement un rucher.
        </p>
        <p>
          Les ruchers peuvent être rendus <strong>publics</strong>, ce qui ajoute une épingle sur la carte communautaire
          et contribue vos données d'inspection anonymisées aux statistiques à l'échelle de la plateforme que
          tous les apiculteurs peuvent voir sur l'écran Membres.
        </p>
        <Screenshot caption="Liste des ruchers sur le tableau de bord web montrant deux ruchers avec le nombre de ruches" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Créer un rucher</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ouvrir la liste des ruchers</strong>
              <p>Sur le web, allez sur <strong>/dashboard</strong>. Sur iOS ou Android, c'est le premier écran après la connexion.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Appuyer sur le bouton +</strong>
              <p>Un formulaire de création s'ouvre avec les champs suivants.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Remplir les détails</strong>
              <p><strong>Nom</strong> (obligatoire) — un court libellé comme « Jardin maison » ou « Lisière de forêt ».<br/>
              <strong>Description</strong> — notes optionnelles visibles uniquement par vous.<br/>
              <strong>Adresse</strong> — adresse en texte libre optionnelle.<br/>
              <strong>Latitude &amp; Longitude</strong> — coordonnées décimales pour l'épingle sur la carte. Si vous laissez ces champs vides, le rucher n'apparaîtra pas sur la carte même s'il est rendu public.<br/>
              <strong>Rendre public</strong> — cochez pour partager l'emplacement et les statistiques anonymisées avec la communauté.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Enregistrer</strong>
              <p>Le nouveau rucher apparaît immédiatement dans votre liste.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Formulaire de création de rucher montrant les champs nom, description et GPS" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Ruchers publics vs privés</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Privé (par défaut)</div>
            <div className="help-stat-card-desc">
              Seul vous pouvez voir le rucher, ses ruches et toutes les données d'inspection. Rien n'est partagé avec la communauté.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Public</div>
            <div className="help-stat-card-desc">
              Une épingle apparaît sur la carte communautaire à vos coordonnées GPS. Vos données d'inspection
              contribuent aux statistiques à l'échelle de la plateforme (moyennes uniquement — les enregistrements individuels ne sont jamais exposés).
              Aucune information permettant d'identifier l'utilisateur n'est publiée.
            </div>
          </div>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Vos coordonnées GPS sont stockées avec une <strong>précision au niveau de la ville</strong> — l'épingle exacte est arrondie pour protéger votre vie privée.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Supprimer un rucher</h2>
        <p>
          Sur le web, ouvrez la page de détail du rucher et faites défiler jusqu'à la zone de danger. Sur mobile, balayez vers la gauche
          sur la ligne du rucher. <strong>Un rucher ne peut être supprimé que lorsqu'il ne contient aucune ruche.</strong> Supprimez
          toutes les ruches d'abord, puis supprimez le rucher.
        </p>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>La suppression d'un rucher est permanente — toutes les ruches et leur historique d'inspection seront perdus. Exportez vos données d'abord si vous avez besoin d'une copie.</p>
        </div>
      </section>
    </>
  );
}
