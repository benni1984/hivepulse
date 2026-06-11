import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HornetTrapsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Qu'est-ce qu'un piège nommé ?</h2>
        <p>
          Un piège nommé est un piège à frelons asiatiques physique qui a été enregistré dans HivePulse.
          Chaque piège reçoit un <strong>code d'accès à 8 caractères</strong>. Quiconque connaît le code —
          vous, un voisin, un bénévole, un chercheur de terrain — peut enregistrer les comptages de captures quotidiens pour
          ce piège sans avoir besoin d'un compte HivePulse.
        </p>
        <p>
          Les pièges nommés facilitent la gestion de réseaux de surveillance distribués : enregistrez des pièges à
          plusieurs emplacements, partagez les codes d'accès avec les associations apicoles locales, et
          collectez les données de capture auprès de la communauté.
        </p>
        <Screenshot caption="Écran de détail du piège montrant le code d'accès, l'historique des captures et le bouton d'enregistrement" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Enregistrer un piège</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Aller à Frelons → Pièges</strong>
              <p>Naviguez vers <strong>/hornets/traps</strong> sur le web, ou ouvrez l'écran Pièges à Frelons sur mobile.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Appuyer sur Enregistrer un nouveau piège</strong>
              <p>Saisissez un nom (ex. « Clôture nord »), des coordonnées GPS et une description optionnelle.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Enregistrer</strong>
              <p>Votre piège est enregistré et un code d'accès à 8 caractères est généré. Notez-le ou partagez-le.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Formulaire d'enregistrement du piège montrant le nom, le GPS et le code d'accès généré" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Enregistrer une capture quotidienne</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Saisir le code d'accès</strong>
              <p>Sur la page Pièges, tapez le code à 8 caractères dans la boîte de recherche. Le piège s'ouvre sans connexion.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Appuyer sur Enregistrer la capture du jour</strong>
              <p>Saisissez le nombre de frelons capturés depuis la dernière vérification.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Enregistrer</strong>
              <p>Une seule capture par piège par jour est stockée — soumettre à nouveau aujourd'hui met à jour l'enregistrement existant.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Trouver des pièges près de vous</h2>
        <p>
          L'onglet <strong>À proximité</strong> sur la page Pièges affiche les pièges enregistrés dans un rayon de 50 mètres
          de votre position GPS actuelle. C'est utile quand vous êtes sur le terrain et souhaitez enregistrer
          une capture pour un piège que vous gérez mais dont vous ne vous rappelez plus le code d'accès.
        </p>
        <Screenshot caption="Liste des pièges à proximité montrant deux pièges dans un rayon de 50 m avec les distances" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Carte des pièges</h2>
        <p>
          Tous les pièges enregistrés apparaissent comme des épingles bleues sur la carte des Frelons à <strong>/hornets/map</strong>.
          Cela donne aux associations apicoles locales un aperçu des lacunes de couverture — zones sans piège
          et haute densité de nids qui bénéficieraient d'un nouveau placement de piège.
        </p>
      </section>
    </>
  );
}
