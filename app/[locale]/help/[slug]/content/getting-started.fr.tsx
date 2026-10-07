import type HelpScreenshot from '@/components/HelpScreenshot';

export default function GettingStartedContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Qu'est-ce que HivePulse ?</h2>
        <p>
          HivePulse est une plateforme de visite apicole et communautaire pour iOS, Android et le web.
          Elle vous permet de consigner chaque visite de ruche — comptages varroa, humeur de la colonie, observations de la reine, cadres de couvain,
          et plus encore — et transforme ces données en graphiques et analyses de tendances au fil du temps.
        </p>
        <p>
          Chaque visite que vous enregistrez contribue également (anonymement) aux statistiques à l'échelle de la plateforme
          qui aident la communauté apicole à comprendre les tendances de santé des colonies dans les régions.
        </p>
        <Screenshot src="/docs/screenshots/dashboard-apiary-list.png" caption="Tableau de bord HivePulse affichant une vue d'ensemble du rucher et la liste des ruches" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Les trois applications</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-globe" style={{ marginRight: 6 }} />Tableau de bord web</div>
            <div className="help-stat-card-desc">
              Tableau de bord complet sur <strong>hivepulse.multihead.de</strong>. Idéal pour gérer les ruchers,
              consulter des graphiques détaillés, générer des lots de QR codes et exporter des données. Fonctionne sur n'importe quel navigateur.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fab fa-apple" style={{ marginRight: 6 }} />Application iOS</div>
            <div className="help-stat-card-desc">
              Application iPhone native optimisée pour une utilisation sur le terrain. Scannez un QR code sur une ruche pour l'ouvrir instantanément,
              enregistrer une visite et consulter les statistiques — sans ouvrir un navigateur.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fab fa-android" style={{ marginRight: 6 }} />Application Android</div>
            <div className="help-stat-card-desc">
              Application Android native avec le même design centré sur le terrain. Prend en charge le scan de QR code via la caméra
              et fonctionne sur les téléphones Android 8 (API 26) et supérieur.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Créer votre compte</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ouvrir la page d'inscription</strong>
              <p>Allez sur <strong>/dashboard/register</strong> sur le web, ou appuyez sur <em>Créer un compte</em> sur l'écran de connexion des applications mobiles.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Saisir vos informations</strong>
              <p>Fournissez une adresse e-mail, un nom d'affichage, votre langue préférée (anglais, français, allemand ou espagnol) et un mot de passe d'au moins 8 caractères.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Commencer à ajouter des ruchers</strong>
              <p>Après l'inscription, vous accédez à la liste des ruchers. Appuyez sur le bouton <strong>+</strong> pour créer votre premier rucher.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/register-form.png" caption="Formulaire d'inscription sur le tableau de bord web" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Premières étapes recommandées</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Créer un rucher</strong>
              <p>Donnez-lui un nom et optionnellement une position GPS pour qu'il apparaisse sur la carte communautaire.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Ajouter vos ruches</strong>
              <p>Créez une entrée par ruche physique. Choisissez le type de ruche correspondant à votre équipement.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Générer et imprimer les QR codes</strong>
              <p>Depuis le web, générez un lot de QR codes et imprimez le PDF. Collez une étiquette sur chaque ruche.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Enregistrer votre première visite</strong>
              <p>Scannez le QR code avec votre téléphone, appuyez sur <em>Nouvelle visite</em> et notez ce que vous observez.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Enregistrez les visites régulièrement — même si vous ne notez que le comptage varroa — et HivePulse créera des graphiques de tendances significatifs après quelques visites.</p>
        </div>
      </section>
      <section className="help-section">
        <h2 className="help-section-title">La visite guidée dans les applications</h2>
        <p>
          À votre première connexion à l'application iPhone ou Android, une courte visite à faire défiler présente
          les QR codes, les visites, les statistiques, les rappels et le suivi des frelons. Passez-la quand vous voulez
          et relancez-la plus tard depuis <strong>Paramètres → Revoir la visite guidée</strong>.
        </p>
      </section>


      <section className="help-section">
        <h2 className="help-section-title">S&rsquo;orienter dans les applications</h2>
        <p>
          Les applications iPhone et Android sont construites de la même façon.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Onglets en bas :</strong> Ruchers, Scanner, Frelons, Membres, Paramètres.</li>
          <li><strong>Barre de la liste des ruchers :</strong> statistiques, lots de QR codes, carte des déplacements, année de l&rsquo;apiculteur.</li>
          <li><strong>Créer quelque chose</strong> (un rucher, une visite, un lot de QR codes, un champ personnalisé), c&rsquo;est toujours le bouton ambre en bas à droite.</li>
          <li><strong>Les paramètres</strong> contiennent cette aide, les notes de version avec la liste complète des fonctions et la visite guidée.</li>
        </ul>
      </section>
    </>
  );
}
