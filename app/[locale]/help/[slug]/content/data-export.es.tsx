import type HelpScreenshot from '@/components/HelpScreenshot';

export default function DataExportContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">¿Por qué exportar?</h2>
        <p>
          Sus datos de inspección le pertenecen. Exportar le da una copia local que puede compartir
          con su veterinario, enviar a una autoridad apícola nacional, usar en una hoja de cálculo para
          análisis personalizados, o archivar como registro a largo plazo independiente de HivePulse.
        </p>
        <Screenshot src="/docs/screenshots/android-data-export.png" caption="Hoja de exportación de datos en móvil mostrando el selector de colmenar y el selector de formato" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Formatos de exportación</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">JSON</div>
            <div className="help-stat-card-desc">
              Formato legible por máquina. Preserva todos los campos incluidos los campos personalizados con sus valores exactos.
              Ideal para archivar o importar en otro sistema. La estructura coincide
              con el contrato API de HivePulse.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">CSV</div>
            <div className="help-stat-card-desc">
              Compatible con hojas de cálculo. Cada inspección es una fila. Se abre directamente en Excel, Google
              Sheets o Numbers. Los campos personalizados se incluyen como columnas adicionales.
              Ideal para análisis manual o compartir con partes interesadas no técnicas.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Cómo exportar (web)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ir a Configuración</strong>
              <p>En el panel de control, abra <strong>Configuración → Exportar datos</strong>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Seleccionar el colmenar</strong>
              <p>Si tiene más de un colmenar, elija cuál exportar. Cada exportación cubre todas las colmenas e inspecciones dentro de ese colmenar.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Elegir JSON o CSV</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Hacer clic en Descargar</strong>
              <p>El archivo se descarga en la carpeta de descargas predeterminada de su navegador.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/hive-detail-export-area.png" caption="Diálogo de exportación en la web — colmenar seleccionado, formato CSV elegido" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Cómo exportar (iOS &amp; Android)</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abrir Configuración</strong>
              <p>Toque la pestaña Configuración en la barra de navegación inferior.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Desplazarse hasta Exportar datos</strong>
              <p>Esta sección solo aparece cuando tiene al menos un colmenar.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Tocar Exportar datos</strong>
              <p>Aparece una hoja con el selector de colmenar y el selector de formato.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Tocar Descargar</strong>
              <p>En iOS, se abre la hoja de compartir del sistema para que pueda guardar en Archivos, enviar por correo electrónico o AirDrop. En Android, el archivo se guarda en su carpeta de Descargas con una notificación toast.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Qué se incluye en la exportación</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Todas las colmenas en el colmenar seleccionado</li>
          <li>Cada inspección para cada colmena, con todos los campos integrados</li>
          <li>Todos los valores de campos personalizados</li>
          <li>Fechas de inspección y marcas de tiempo de creación</li>
        </ul>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Las exportaciones no incluyen fotos (HivePulse no almacena fotos de inspección). Tampoco incluyen datos de tokens QR o información de lotes.</p>
        </div>
      </section>
    </>
  );
}
