import type HelpScreenshot from '@/components/HelpScreenshot';

export default function QrCodesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Pourquoi utiliser les QR codes ?</h2>
        <p>
          Quand vous êtes au rucher avec des gants, trouver la bonne ruche dans une application téléphone est lent.
          Une étiquette QR code sur chaque ruche vous permet de scanner-et-ouvrir en moins de deux secondes — l'écran de détail
          de la bonne ruche s'ouvre instantanément, prêt pour une nouvelle inspection.
        </p>
        <Screenshot caption="Étiquette QR code sur une ruche, prête à être scannée" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Étape 1 — Générer un lot (web)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Aller aux Lots QR</strong>
              <p>Dans le tableau de bord web, ouvrez <strong>Paramètres → Lots QR</strong> (ou naviguez directement vers <code>/dashboard/qr-batches</code>).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Appuyer sur + Nouveau lot</strong>
              <p>Saisissez le nombre de codes à générer (1–50). Un code par ruche physique.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Télécharger le PDF</strong>
              <p>Ouvrez le nouveau lot et cliquez sur <em>Télécharger PDF</em>. Le PDF contient un QR code par page, dimensionné pour les planches d'étiquettes standard.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Imprimer et coller</strong>
              <p>Imprimez sur du papier d'étiquettes imperméable si possible. Collez une étiquette sur chaque ruche — le couvercle est un bon endroit.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Page de détail du lot QR montrant la liste des jetons et le bouton Télécharger PDF" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Étape 2 — Lier un code à une ruche (mobile)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ouvrir l'écran de détail de la ruche</strong>
              <p>Naviguez vers la ruche que vous souhaitez lier (via la liste des ruchers).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Appuyer sur Assigner QR / Initialiser la ruche</strong>
              <p>La caméra s'ouvre en mode scan.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Scanner l'étiquette imprimée</strong>
              <p>Pointez la caméra sur le QR code de l'étiquette. Le jeton est lu automatiquement — aucun appui de bouton requis.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Confirmer le lien</strong>
              <p>Un écran de confirmation affiche le nom de la ruche. Appuyez sur <em>Confirmer</em> pour terminer. Le jeton QR est maintenant lié de façon permanente à cette ruche.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Overlay du scanner QR montrant un code en cours de scan et la feuille de confirmation" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Étape 3 — Scanner pour ouvrir pendant les inspections</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Appuyer sur l'icône scanner</strong>
              <p>Le scanner QR est disponible depuis la barre de navigation inférieure sur iOS et Android.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Pointer sur l'étiquette de la ruche</strong>
              <p>L'application lit le code et ouvre immédiatement l'écran de détail de la ruche.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Appuyer sur Nouvelle inspection</strong>
              <p>Vous êtes maintenant sur la bonne ruche, prêt à enregistrer votre visite.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Scan d'un QR code de ruche sur le terrain — la ruche s'ouvre instantanément" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Conseils</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Utilisez du matériau d'étiquette imperméable (polypropylène ou papier plastifié). Les étiquettes en papier standard se dégradent rapidement à l'extérieur, surtout sous la pluie et en plein soleil.</p>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Chaque jeton QR ne peut être lié qu'à une seule ruche. Si vous devez réutiliser une étiquette (par ex. la ruche a été divisée), générez un nouveau lot — les anciens jetons restent liés à leur ruche d'origine.</p>
        </div>
      </section>
    </>
  );
}
