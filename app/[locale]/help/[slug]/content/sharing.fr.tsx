import type HelpScreenshot from '@/components/HelpScreenshot';

export default function SharingContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Travailler ensemble sur un rucher</h2>
        <p>
          Deux apiculteurs peuvent s&rsquo;occuper ensemble du même rucher, ou de quelques ruches. Vous invitez l&rsquo;autre
          personne par son adresse e-mail ; dès qu&rsquo;elle accepte, vous voyez tous deux les mêmes ruches et visites, et
          vous pouvez tous deux saisir des visites, modifier des ruches et en ajouter.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            <strong>Ce qui reste au propriétaire.</strong> Celui qui a créé le rucher en est le propriétaire. Lui seul peut
            supprimer un rucher ou une ruche, rendre un rucher public sur la carte de la communauté, déplacer des ruches
            et inviter ou retirer des personnes. Un collaborateur peut toujours quitter de lui-même.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Partager tout le rucher ou quelques ruches</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Un rucher</strong> partage le rucher et chaque ruche qu&rsquo;il contient, y compris celles que vous ajoutez plus tard.</li>
          <li>
            <strong>Une seule ruche</strong> ne partage que cette ruche. L&rsquo;autre personne voit le nom de son rucher pour
            s&rsquo;y retrouver, mais aucune des autres ruches, et ne peut ni modifier le rucher ni y ajouter des ruches.
          </li>
        </ul>
        <p>Pour partager certaines ruches d&rsquo;un rucher mais pas toutes, placez-les dans un rucher à part et partagez-le.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Inviter quelqu&rsquo;un</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ouvrir le rucher ou la ruche</strong>
              <p>Sur le site, <em>Travailler ensemble</em> sur la page ; dans les applications, touchez l&rsquo;icône des personnes dans la barre du haut.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Saisir l&rsquo;adresse e-mail et envoyer</strong>
              <p>L&rsquo;invitation reste <em>en attente</em> jusqu&rsquo;à ce qu&rsquo;elle soit acceptée. Vous pouvez la retirer depuis le même écran.</p>
            </div>
          </li>
        </ol>
        <Screenshot android="/docs/screenshots/android-sharing.png" web="/docs/screenshots/sharing-panel.png" caption="Inviter un autre apiculteur par e-mail" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Accepter une invitation</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>
            <strong>Vous avez déjà un compte</strong> avec cette adresse : l&rsquo;invitation apparaît tout en haut de votre
            liste de ruchers avec <em>Accepter</em> et <em>Refuser</em>. Un e-mail vous en informe aussi.
          </li>
          <li>
            <strong>Vous n&rsquo;avez pas encore de compte :</strong> l&rsquo;e-mail contient un lien. Ouvrez-le, inscrivez-vous
            ou connectez-vous avec cette adresse, puis acceptez. Si vous vous connectez avec Apple ou Google, l&rsquo;invitation vous attend déjà dans
            la liste des ruchers : touchez seulement <em>Accepter</em>. Si vous vous êtes inscrit avec un mot de passe dans
            l&rsquo;application, allez à la fin de la liste des ruchers, touchez <em>Utiliser un lien d&rsquo;invitation</em> et
            collez le lien.
          </li>
        </ul>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Arrêter le partage</h2>
        <p>
          Le propriétaire retire une personne sur le même écran <em>Travailler ensemble</em> ; le rucher ou la ruche
          disparaît aussitôt de la liste de l&rsquo;autre personne. Un collaborateur peut quitter de son côté. Les visites que
          vous avez saisies restent attachées à la ruche.
        </p>
      </section>
    </>
  );
}
