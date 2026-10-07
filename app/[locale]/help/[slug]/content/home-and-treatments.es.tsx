import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HomeAndTreatmentsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Tu día de un vistazo</h2>
        <p>
          El inicio de la lista de colmenares (y del panel en la web) te dice lo que importa al abrir HivePulse. Incluye las
          colmenas que otros apicultores han compartido contigo. Toca una colmena para abrirla.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>
            <strong>Próxima revisión.</strong> Una colmena toca cuando ha pasado tu intervalo de recordatorio desde su última
            revisión (contado desde el día que anotaste, no desde el día en que lo escribiste). Ves cuántas van atrasadas y
            cuántas tocan en los próximos tres días. Una colmena nunca revisada toca tantos días después de crearse.
          </li>
          <li>
            <strong>Estado de las colmenas.</strong> Bien, a vigilar, alerta o desconocido, según la última revisión:
            <em> alerta</em> por varroa alta, celdas de enjambre o ánimo agresivo; <em>a vigilar</em> por varroa media, ánimo
            nervioso o reina no vista; <em>desconocido</em> para colmenas nunca revisadas. Las que necesitan atención se
            listan con el motivo.
          </li>
          <li>
            <strong>Próximos tratamientos.</strong> Lo previsto en los próximos 30 días, primero lo atrasado, cada uno con un
            botón <em>Hecho</em>.
          </li>
          <li>
            <strong>Un anuncio.</strong> De vez en cuando puede aparecer aquí una tarjeta nuestra. Es solo texto: sin red
            publicitaria y sin rastreo.
          </li>
        </ul>
        <p>
          El intervalo y la temporada se ajustan en <em>Ajustes &rarr; Recordatorios de revisión</em>. Fuera de temporada las
          fechas se calculan igual y una nota te lo indica.
        </p>
        <Screenshot android="/docs/screenshots/android-home-summary.png" web="/docs/screenshots/home-summary.png" caption="El inicio al principio de la lista de colmenares" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Planificar un tratamiento</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abre la colmena o el colmenar</strong>
              <p>En la página de una colmena elige <em>Tratamientos</em>. Para todas las colmenas de un colmenar usa el icono de tratamientos de su barra.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Producto, día y una nota opcional</strong>
              <p>Por ejemplo ácido oxálico el día en que piensas tratar. Toca <em>Planificar un tratamiento</em>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Márcalo como hecho</strong>
              <p><em>Hecho</em> en el inicio o en la lista. Un tratamiento marcado por error se puede reabrir; los últimos hechos aparecen debajo.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            Planificar no es registrar. Lo que aplicaste de verdad sigue escribiéndose en la revisión (<em>tratamiento
            aplicado</em>). Quien recibió colmenas sueltas puede planificar para esas colmenas, no para todo el colmenar.
          </p>
        </div>
        <Screenshot android="/docs/screenshots/android-treatments.png" web="/docs/screenshots/treatments-panel.png" caption="Planificar un tratamiento y marcarlo" />
      </section>
    </>
  );
}
