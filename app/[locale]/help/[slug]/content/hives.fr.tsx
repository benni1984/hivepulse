import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HivesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Qu'est-ce qu'une fiche ruche ?</h2>
        <p>
          Une fiche ruche représente une colonie physique. Elle a un nom, un type et une étiquette QR code optionnelle.
          Tout l'historique d'inspection est attaché à la fiche ruche, vous permettant de visualiser
          la tendance complète de santé de cette colonie au fil du temps.
        </p>
        <Screenshot src="/docs/screenshots/android-hive-detail.png" caption="Écran de détail de la ruche montrant le type, la date de la dernière inspection et la liste des inspections" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Types de ruches</h2>
        <div className="help-stat-grid">
          {[
            { name: 'Langstroth', desc: 'La ruche la plus courante en Amérique du Nord et à l\'international. Haussess profondes et médianes avec des cadres amovibles.' },
            { name: 'Dadant', desc: 'Populaire en Europe continentale. Chambre à couvain plus grande que la Langstroth, conçue pour les grandes colonies.' },
            { name: 'Top Bar', desc: 'Ruche horizontale où les abeilles construisent les rayons vers le bas depuis des barrettes mobiles. Courante en Afrique de l\'Est et chez les apiculteurs naturels.' },
            { name: 'Warré', desc: 'Ruche à empilement vertical basée sur la construction naturelle des rayons. Philosophie d\'intervention minimale.' },
            { name: 'Autre', desc: 'À utiliser pour tout type de ruche non listé ci-dessus — colonies nucléaires, ruches d\'observation, etc.' },
          ].map(h => (
            <div className="help-stat-card" key={h.name}>
              <div className="help-stat-card-name">{h.name}</div>
              <div className="help-stat-card-desc">{h.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 8 }}>
          Choisir le bon type n'affecte pas la fonctionnalité — c'est une étiquette pour vous aider à
          distinguer vos ruches dans la liste.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Créer une ruche</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ouvrir un rucher</strong>
              <p>Appuyez sur le nom du rucher pour ouvrir sa vue détaillée.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Appuyer sur le bouton + (Nouvelle ruche)</strong>
              <p>Un formulaire apparaît demandant un nom et un type de ruche.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Choisir un nom</strong>
              <p>Utilisez n'importe quel schéma de nommage : « Ruche 1 », « Boîte bleue », « Prairie sud A ».</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Sélectionner un type de ruche</strong>
              <p>Choisissez dans la liste ci-dessus. Vous pouvez le modifier plus tard depuis l'écran de détail de la ruche.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Assigner un QR code (optionnel)</strong>
              <p>Après l'enregistrement, ouvrez la ruche et appuyez sur <em>Assigner QR</em> pour lier un jeton QR imprimé.
              Voir <a href="qr-codes">QR Codes</a> pour le workflow complet.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/hive-create-form.png" caption="Formulaire de nouvelle ruche avec le champ nom et le sélecteur de type de ruche" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Consulter une ruche</h2>
        <p>
          L'écran de détail de la ruche affiche :
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Le type de ruche et la date d'ajout</li>
          <li>La date de la dernière inspection</li>
          <li>L'historique complet des inspections, la plus récente en premier</li>
          <li>Un bouton pour démarrer une nouvelle inspection</li>
          <li>Sur le web : onglets pour les Inspections, les Statistiques et les Champs personnalisés</li>
        </ul>
        <Screenshot src="/docs/screenshots/hive-detail-web.png" caption="Page de détail de la ruche sur le web montrant l'onglet inspections et les métadonnées de la ruche" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Conseils</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Donnez à chaque ruche un nom court et unique. Quand vous avez beaucoup de ruches, des noms comme « A1 » ou « Jardin haut » sont plus faciles à lire dans la liste que « Ruche 1 », « Ruche 2 », « Ruche 3 ».</p>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Supprimer une ruche supprime définitivement tout l'historique d'inspection de cette colonie. Exportez vos données avant de supprimer si vous souhaitez conserver les enregistrements.</p>
        </div>
      </section>
    </>
  );
}
