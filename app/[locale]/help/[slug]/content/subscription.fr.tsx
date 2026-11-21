import type HelpScreenshot from '@/components/HelpScreenshot';

export default function SubscriptionContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Ce qui est gratuit</h2>
        <p>HivePulse est gratuit jusqu’à 10 ruches, avec autant de ruchers que vous voulez. Dix couvre l’apiculteur qui a quelques ruches derrière la maison, à qui il ne faut jamais demander d’argent.</p>
        <p>Au-delà, un abonnement Supporter coûte 19,99 € par an. Une année plutôt qu’un mois parce que l’apiculture est saisonnière : presque tout se passe entre mars et octobre, et un abonnement mensuel inviterait à une résiliation chaque automne.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Ce qu’atteindre la limite ne fait jamais</h2>
        <p><strong>Atteindre une limite ne ferme jamais ce qui existe déjà.</strong></p>
        <p>Rien n’est caché, rien ne passe en lecture seule, rien n’est supprimé. Seule s’arrête l’ajout de la onzième ruche. Si vous vous abonnez, montez à quinze ruches puis cessez de payer, vous gardez les quinze, vous continuez à les visiter et vous gardez tout votre historique : vous ne pouvez simplement pas en ajouter une seizième avant la reprise.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Ce que comprend l’abonnement</h2>
        <ul className="help-list">
          <li>Autant de ruches que vous en avez.</li>
          <li>Inviter quelqu’un à travailler avec vous sur un rucher ou sur une seule ruche. C’est celui qui invite qui a besoin de l’abonnement ; l’invité qui accepte n’en a pas besoin.</li>
          <li>Vos propres champs sur les ruches et les visites. Les champs d’un rucher suivent l’abonnement de son propriétaire, afin que toutes les personnes invitées puissent s’en servir.</li>
          <li>Tout l’historique des statistiques au lieu de la dernière année, et la carte sanitaire régionale dans Membres.</li>
        </ul>
        <p>Gratuits dans tous les cas, et cela ne changera pas : le suivi du frelon asiatique, l’année apicole, les QR codes et le scan, les visites saisies sans réseau et l’export de vos propres données. Les statistiques sont réduites et non refusées — un compte gratuit qui demande tout l’historique reçoit un an, pas un message d’erreur.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">S’abonner</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">Sur le site, ouvrez <strong>Tableau de bord → Abonnement</strong>. La page indique combien de ruches vous avez, ce que comprend l’abonnement et si quelque chose est déjà en cours.</div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">Choisissez <strong>S’abonner</strong> et réglez le paiement. Le formulaire de paiement s’ouvre directement sur la page — vous restez sur HivePulse, et le bouton affiche le prix dans votre monnaie. Tout est débloqué dès la confirmation — sur le site et dans les deux applications, car l’abonnement appartient au compte et non à l’appareil.</div>
          </li>
        </ol>
        <p>Dans les applications iPhone et Android, l’achat se fait dans <strong>Réglages → Soutien</strong>, ou depuis la carte de l’onglet Membres. Il passe par l’App Store ou Google Play, comme ces magasins l’exigent, et le prix y est le même. Quel que soit le chemin, l’abonnement appartient à votre compte HivePulse et vaut partout où vous vous connectez : achetez-le sur le téléphone et le site le sait quelques secondes plus tard.</p>
        <p>Changé de téléphone, ou réinstallé l’application ? <strong>Restaurer l’achat</strong>, en bas de cette même page, récupère un abonnement acheté dans un magasin. Pour un abonnement acheté sur le site, vous n’en avez jamais besoin : il suit le compte de toute façon.</p>
        <Screenshot src="/docs/screenshots/subscription.png" caption="La page Abonnement : ce que vous avez, ce que comprend l’abonnement et où résilier" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Résilier — et ce qui se passe ensuite</h2>
        <p>Un abonnement acheté via l’App Store ou Google Play ne peut être résilié que là — sur l’iPhone dans Réglages sous votre nom, sur Google Play dans Paiements et abonnements. Ni l’application ni le site ne peuvent le faire ; la page Abonnement le dit et indique le bon endroit. Un abonnement acheté sur le site se résilie par le lien de cette même page.</p>
        <p>Une résiliation ne met pas fin immédiatement : l’abonnement court jusqu’à la fin de la période payée, et la page Abonnement affiche cette date. Ensuite la limite gratuite s’applique de nouveau — et, comme ci-dessus, tout ce que vous avez saisi reste exactement où il est.</p>
      </section>
    </>
  );
}
