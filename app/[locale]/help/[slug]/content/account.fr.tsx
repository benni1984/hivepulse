import type HelpScreenshot from '@/components/HelpScreenshot';

export default function AccountContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Modifier votre profil</h2>
        <p>
          Votre profil stocke votre nom d'affichage et votre langue préférée. Le nom d'affichage
          apparaît dans le panneau d'administration si votre compte a des privilèges administrateur. Le paramètre de langue
          contrôle la locale que les applications mobiles utilisent pour les libellés d'interface.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Web :</strong> Allez sur <strong>Dashboard → Profil</strong> (<code>/dashboard/profile</code>).
              <strong> Mobile :</strong> Ouvrez l'onglet Paramètres.
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Modifier votre nom d'affichage</strong>
              <p>Saisissez le nouveau nom et appuyez sur Enregistrer le profil / Enregistrer.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Changer la langue</strong>
              <p>Sélectionnez Anglais, Français, Allemand ou Espagnol dans le sélecteur de langue.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-settings-account.png" caption="Section Profil dans les Paramètres montrant le champ nom d'affichage et le sélecteur de langue" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Changer votre mot de passe</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ouvrir la section Changer le mot de passe</strong>
              <p>Sur le web : Dashboard → Profil. Sur mobile : Paramètres → faire défiler jusqu'à Changer le mot de passe.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Saisir votre mot de passe actuel</strong>
              <p>Ceci confirme que vous êtes le propriétaire du compte.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Saisir et confirmer votre nouveau mot de passe</strong>
              <p>Minimum 8 caractères.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Appuyer sur Changer le mot de passe</strong>
              <p>Vous restez connecté. Toutes les autres sessions actives restent valides.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Mot de passe actuel oublié ? Utilisez le lien <strong>Mot de passe oublié</strong> sur l'écran de connexion pour recevoir un lien de réinitialisation par e-mail.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Supprimer votre compte</h2>
        <p>
          Supprimer votre compte supprime définitivement votre adresse e-mail, votre nom d'affichage, tous les ruchers,
          toutes les ruches et tous les enregistrements d'inspection. Cette action <strong>ne peut pas être annulée</strong>.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Exporter vos données d'abord</strong>
              <p>Téléchargez un export JSON ou CSV de chaque rucher si vous souhaitez conserver vos enregistrements.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Ouvrir la Zone de danger</strong>
              <p>Sur le web : Dashboard → Profil → Zone de danger. Sur mobile : Paramètres → faire défiler vers le bas.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Appuyer sur Supprimer le compte et confirmer</strong>
              <p>Un dialogue de confirmation explique ce qui sera supprimé. Confirmez pour continuer.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Vos données d'inspection ont peut-être contribué aux statistiques communautaires. Supprimer votre compte retire vos données des futurs agrégats communautaires, mais les statistiques historiques déjà calculées ne sont pas recalculées rétroactivement.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Se déconnecter</h2>
        <p>
          Appuyez sur <strong>Se déconnecter</strong> dans les Paramètres (mobile) ou dans le menu déroulant en haut à droite (web).
          Votre jeton de session est révoqué côté serveur. Vous serez redirigé vers l'écran de connexion.
          Vos données sont préservées — se déconnecter ne supprime rien.
        </p>
      </section>
    </>
  );
}
