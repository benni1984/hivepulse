import type HelpScreenshot from '@/components/HelpScreenshot';

export default function DataExportContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Pourquoi exporter ?</h2>
        <p>
          Vos données d'inspection vous appartiennent. L'exportation vous donne une copie locale que vous pouvez partager
          avec votre vétérinaire, soumettre à une autorité apicole nationale, utiliser dans un tableur pour
          une analyse personnalisée, ou archiver comme enregistrement à long terme indépendant de HivePulse.
        </p>
        <Screenshot src="/docs/screenshots/android-data-export.png" caption="Feuille d'export de données sur mobile montrant le sélecteur de rucher et le sélecteur de format" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Formats d'export</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">JSON</div>
            <div className="help-stat-card-desc">
              Format lisible par machine. Préserve tous les champs y compris les champs personnalisés avec leurs valeurs exactes.
              Idéal pour l'archivage ou l'importation dans un autre système. La structure correspond
              au contrat API HivePulse.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">CSV</div>
            <div className="help-stat-card-desc">
              Compatible avec les tableurs. Chaque inspection est une ligne. S'ouvre directement dans Excel, Google
              Sheets ou Numbers. Les champs personnalisés sont inclus comme colonnes supplémentaires.
              Idéal pour l'analyse manuelle ou le partage avec des parties prenantes non techniques.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Comment exporter (web)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Aller aux Paramètres</strong>
              <p>Dans le tableau de bord, ouvrez <strong>Paramètres → Exporter les données</strong>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Sélectionner le rucher</strong>
              <p>Si vous avez plusieurs ruchers, choisissez lequel exporter. Chaque export couvre toutes les ruches et inspections de ce rucher.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Choisir JSON ou CSV</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Cliquer sur Télécharger</strong>
              <p>Le fichier se télécharge dans le dossier de téléchargements par défaut de votre navigateur.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/hive-detail-export-area.png" caption="Dialogue d'export sur le web — rucher sélectionné, format CSV choisi" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Comment exporter (iOS &amp; Android)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ouvrir les Paramètres</strong>
              <p>Appuyez sur l'onglet Paramètres dans la barre de navigation inférieure.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Faire défiler jusqu'à Export de données</strong>
              <p>Cette section n'apparaît que lorsque vous avez au moins un rucher.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Appuyer sur Exporter les données</strong>
              <p>Une feuille apparaît avec le sélecteur de rucher et le sélecteur de format.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Appuyer sur Télécharger</strong>
              <p>Sur iOS, la feuille de partage système s'ouvre pour que vous puissiez sauvegarder dans Fichiers, envoyer par e-mail ou AirDrop. Sur Android, le fichier est sauvegardé dans votre dossier Téléchargements avec une notification toast.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Ce qui est inclus dans l'export</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Toutes les ruches du rucher sélectionné</li>
          <li>Chaque inspection pour chaque ruche, avec tous les champs intégrés</li>
          <li>Toutes les valeurs des champs personnalisés</li>
          <li>Les dates d'inspection et les horodatages de création</li>
        </ul>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Les exports n'incluent pas les photos (HivePulse ne stocke pas les photos d'inspection). Ils n'incluent pas non plus les données des jetons QR ou les informations sur les lots.</p>
        </div>
      </section>
    </>
  );
}
