import type HelpScreenshot from '@/components/HelpScreenshot';

export default function CustomFieldsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Que sont les champs personnalisés ?</h2>
        <p>
          Les champs personnalisés vous permettent d'ajouter des questions supplémentaires au formulaire d'inspection qui ne figurent pas dans
          l'ensemble intégré. Par exemple : une case à cocher pour « essaimage artificiel effectué », un nombre pour
          « cadres de réserves », ou une liste déroulante pour la source de nectar actuellement en fleurs.
        </p>
        <p>
          Les champs sont actuellement gérés sur le <strong>tableau de bord web</strong> et apparaissent sur le
          formulaire d'inspection sur toutes les plateformes.
        </p>
        <Screenshot src="/docs/screenshots/custom-fields-list.png" caption="Page des paramètres des champs personnalisés montrant une liste de champs à portée utilisateur" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Portée des champs</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Portée utilisateur</div>
            <div className="help-stat-card-desc">
              S'applique à <strong>chaque inspection dans tous vos ruchers</strong>. À utiliser pour les champs
              toujours pertinents pour votre pratique — ex. « type de traitement » ou « essaimage artificiel ».
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Portée rucher</div>
            <div className="help-stat-card-desc">
              S'applique uniquement aux inspections <strong>au sein d'un rucher spécifique</strong>. À utiliser pour les champs
              pertinents uniquement à un emplacement — ex. « proximité d'un champ de colza » pour un
              rucher près d'un champ de colza.
            </div>
          </div>
        </div>
        <p style={{ marginTop: 8 }}>
          Si un champ à portée utilisateur et un champ à portée rucher ont le même nom, le champ à portée rucher
          a la priorité pour les ruches de ce rucher.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Types de champs</h2>
        <div className="help-stat-grid">
          {[
            { name: 'Texte', desc: 'Une saisie de texte libre. Bon pour les notes, observations ou toute réponse ouverte.' },
            { name: 'Nombre', desc: 'Une saisie numérique. Stocké comme décimal — utile pour les mesures comme les comptages de cadres ou les poids.' },
            { name: 'Booléen', desc: 'Un interrupteur oui/non. Idéal pour les actions faites ou non : « nourri aujourd\'hui », « nouveau rayon construit ».' },
            { name: 'Date', desc: 'Un sélecteur de date. À utiliser pour enregistrer des événements spécifiques — « date du dernier traitement », « reine introduite le ».' },
            { name: 'Sélection', desc: 'Une liste déroulante avec vos propres options. Utile pour les données catégorielles — « source de nectar », « produit de traitement ».' },
          ].map(f => (
            <div className="help-stat-card" key={f.name}>
              <div className="help-stat-card-name">{f.name}</div>
              <div className="help-stat-card-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Créer un champ personnalisé</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Aller aux Définitions de champs</strong>
              <p>Dans le tableau de bord web, naviguez vers <strong>Dashboard → Définitions de champs</strong>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Choisir la cible</strong>
              <p>Les champs <strong>Ruche</strong> apparaissent sur le formulaire de détail de la ruche. Les champs <strong>Inspection</strong> apparaissent sur le formulaire d'inspection — c'est le choix le plus courant.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Choisir la portée</strong>
              <p>Utilisateur (tous les ruchers) ou Rucher (un rucher spécifique).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Nommer le champ et choisir un type</strong>
              <p>Pour les champs de sélection, saisissez également les options de la liste déroulante (une par ligne).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Enregistrer</strong>
              <p>Le champ apparaît immédiatement sur le formulaire d'inspection pour les ruchers concernés.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/custom-field-create.png" caption="Création d'un nouveau champ personnalisé — nom, type et portée sont sélectionnés" />
      </section>
    </>
  );
}
