import type HelpScreenshot from '@/components/HelpScreenshot';

export default function InspectionsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Qu'est-ce qu'une inspection ?</h2>
        <p>
          Une inspection est une visite unique à une ruche. Chaque fois que vous ouvrez une ruche, vous enregistrez
          vos observations sous forme de fiche d'inspection : indicateurs de santé, données de population, statut de la reine,
          et tout traitement ou alimentation effectué. Au fil du temps, ces fiches dressent un tableau de
          la santé de la colonie que les graphiques et analyses de tendances peuvent révéler.
        </p>
        <Screenshot src="/docs/screenshots/android-inspection-form.png" caption="Formulaire d'inspection ouvert sur une ruche, montrant toutes les sections" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Enregistrer une inspection</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ouvrir la ruche</strong>
              <p>Naviguez vers l'écran de détail de la ruche — via la liste des ruchers ou en scannant le QR code sur la ruche.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Appuyer sur Nouvelle inspection</strong>
              <p>Le formulaire d'inspection s'ouvre. La date est par défaut aujourd'hui mais peut être modifiée (pour les visites passées).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Remplir vos observations</strong>
              <p>Seule la date est obligatoire. Tous les autres champs sont optionnels — notez ce que vous avez vérifié et laissez le reste.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Enregistrer</strong>
              <p>L'inspection est ajoutée à l'historique de la ruche et contribue immédiatement aux graphiques de tendances.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-inspection-form-bottom.png" caption="Enregistrement d'une inspection — les champs date et comptage varroa sont visibles" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tous les champs d'inspection expliqués</h2>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Santé de la colonie</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Comptage varroa</div>
            <div className="help-stat-card-desc">
              Nombre d'acariens Varroa destructor trouvés dans un lavage d'échantillon (lavage au sucre ou à l'alcool de ~100 abeilles).
              C'est l'indicateur de santé le plus important — une charge élevée en acariens réduit la durée de vie des ouvrières, affaiblit la colonie et transmet des virus.
            </div>
            <span className="help-stat-card-good">Bon : 0–2 acariens pour 100</span>{' '}
            <span className="help-stat-card-warn">Agir : 3+ acariens pour 100</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Humeur de la colonie</div>
            <div className="help-stat-card-desc">
              Comment les abeilles se sont comportées pendant l'inspection.
              <br /><strong>Calme</strong> — les abeilles étaient douces, se déplaçaient lentement, peu de piqûres.<br />
              <strong>Nerveuse</strong> — les abeilles étaient agitées, difficiles à travailler.<br />
              <strong>Agressive</strong> — les abeilles attaquaient activement, piqûres multiples.
            </div>
            <span className="help-stat-card-good">Objectif : surtout Calme</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Reine vue</div>
            <div className="help-stat-card-desc">
              Cochez ceci si vous avez visuellement confirmé la présence de la reine pendant l'inspection.
              Si vous voyez des œufs frais mais pas la reine elle-même, laissez décoché — les œufs ne sont qu'une preuve indirecte.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Couleur de la reine</div>
            <div className="help-stat-card-desc">
              Le codage couleur international SICAMM par année. Blanc (années se terminant par 1/6), Jaune (2/7),
              Rouge (3/8), Vert (4/9), Bleu (5/0). Vous aide à suivre l'âge de la reine.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Cellules d'essaimage vues</div>
            <div className="help-stat-card-desc">
              Cochez ceci si vous avez aperçu des cellules royales construites pour l'essaimage. C'est un avertissement précoce
              que la colonie peut essaimer dans les jours à venir.
            </div>
            <span className="help-stat-card-warn">Action requise si coché</span>
          </div>
        </div>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: '24px 0 12px', color: 'var(--text-primary)' }}>Population</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Cadres de couvain</div>
            <div className="help-stat-card-desc">
              Nombre de cadres contenant du couvain (œufs, larves ou cellules operculées). Cela mesure le potentiel de croissance de la colonie.
              Une colonie forte et saine en pleine saison remplit typiquement 7–9 cadres dans une Langstroth standard.
            </div>
            <span className="help-stat-card-good">Bon (printemps/été) : 6–9 cadres</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Cadres de miel</div>
            <div className="help-stat-card-desc">
              Nombre de cadres contenant du miel stocké. Important pour surveiller les réserves hivernales.
              Une colonie a besoin d'environ 15–20 kg de miel pour survivre à un hiver froid.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Force de la population</div>
            <div className="help-stat-card-desc">
              Échelle subjective de 1 à 5 pour la force globale de la colonie. Utile quand vous voulez suivre la population relative
              sans compter les cadres individuels.
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: '24px 0 12px', color: 'var(--text-primary)' }}>Poids &amp; traitement</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Poids (kg)</div>
            <div className="help-stat-card-desc">
              Poids total de la ruche depuis une balance. Suivre le poids au fil du temps montre les flux de nectar et
              la consommation des réserves hivernales sans ouvrir la ruche.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Traitement appliqué</div>
            <div className="help-stat-card-desc">
              Champ texte libre pour noter tout traitement varroa, antibiotique ou autre médicament utilisé.
              Tenir des registres de traitement est une obligation légale dans de nombreux pays.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Alimentation effectuée</div>
            <div className="help-stat-card-desc">
              Case à cocher pour enregistrer que vous avez nourri la colonie. Utilisez le champ Notes pour préciser le type et la quantité.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Type d'alimentation</div>
            <div className="help-stat-card-desc">
              Ce que vous avez donné : sirop de sucre, candi, substitut de pollen, etc.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Conseils</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Enregistrez les comptages varroa de manière cohérente en utilisant la même méthode (lavage au sucre ou à l'alcool) pour que le graphique de tendances soit comparable entre les inspections.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Même une inspection partielle (juste l'humeur et les cadres de couvain) est précieuse. Des enregistrements partiels cohérents valent mieux que des enregistrements parfaits qui n'arrivent qu'une fois par an.</p>
        </div>
      </section>
    </>
  );
}
