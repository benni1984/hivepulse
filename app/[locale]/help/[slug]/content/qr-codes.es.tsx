import type HelpScreenshot from '@/components/HelpScreenshot';

export default function QrCodesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">¿Por qué usar códigos QR?</h2>
        <p>
          Cuando está en el colmenar con guantes, encontrar la colmena correcta en una aplicación de teléfono es lento.
          Una etiqueta de código QR en cada colmena le permite escanear y abrir en menos de dos segundos — la pantalla de detalles
          de la colmena correcta se abre instantáneamente, lista para una nueva inspección.
        </p>
        <Screenshot src="/docs/screenshots/android-qr-batches.png" caption="Etiqueta de código QR en una colmena, lista para ser escaneada" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Paso 1 — Generar un lote (web)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ir a Lotes QR</strong>
              <p>En el panel de control web, abra <strong>Configuración → Lotes QR</strong> (o navegue directamente a <code>/dashboard/qr-batches</code>).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tocar + Nuevo lote</strong>
              <p>Ingrese el número de códigos a generar (1–50). Un código por colmena física.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Descargar el PDF</strong>
              <p>Abra el nuevo lote y haga clic en <em>Descargar PDF</em>. El PDF contiene un código QR por página, dimensionado para hojas de etiquetas estándar.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Imprimir y pegar</strong>
              <p>Imprima en papel de etiquetas resistente al agua si es posible. Pegue una etiqueta en cada colmena — la tapa es un buen lugar.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/qr-batch-detail.png" caption="Página de detalles del lote QR mostrando la lista de tokens y el botón Descargar PDF" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Paso 2 — Vincular un código a una colmena (móvil)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abrir la pantalla de detalles de la colmena</strong>
              <p>Navegue a la colmena que desea vincular (a través de la lista de colmenares).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tocar Asignar QR / Inicializar colmena</strong>
              <p>La cámara se abre en modo de escaneo.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Escanear la etiqueta impresa</strong>
              <p>Apunte la cámara al código QR en la etiqueta. El token se lee automáticamente — no se necesita pulsar ningún botón.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Confirmar el vínculo</strong>
              <p>Una pantalla de confirmación muestra el nombre de la colmena. Toque <em>Confirmar</em> para finalizar. El token QR está ahora permanentemente vinculado a esa colmena.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-qr-scan.png" caption="Superposición del escáner QR mostrando un código siendo escaneado y la hoja de confirmación" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Paso 3 — Escanear para abrir durante las inspecciones</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Tocar el ícono de escaneo</strong>
              <p>El escáner QR está disponible desde la barra de navegación inferior en iOS y Android.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Apuntar a la etiqueta de la colmena</strong>
              <p>La aplicación lee el código y abre inmediatamente la pantalla de detalles de la colmena.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Tocar Nueva inspección</strong>
              <p>Ahora está en la colmena correcta, listo para registrar su visita.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/android-qr-batches.png" caption="Escaneando un código QR de colmena en el campo — la colmena se abre instantáneamente" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Consejos</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Use material de etiquetas resistente al agua (polipropileno o papel laminado). Las etiquetas de papel estándar se deterioran rápidamente al aire libre, especialmente con lluvia y sol directo.</p>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Cada token QR solo puede vincularse a una colmena. Si necesita reutilizar una etiqueta (por ejemplo, la colmena se dividió), genere un nuevo lote — los tokens antiguos permanecen vinculados a su colmena original.</p>
        </div>
      </section>
    </>
  );
}
