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
            <em> alerta</em> por varroa alta, celdas de enjambre o comportamiento agresivo; <em>a vigilar</em> por varroa media, comportamiento
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

      <section className="help-section">
        <h2 className="help-section-title">El libro de tratamientos</h2>
        <p>Todos los tratamientos realizados en un colmenar durante un año, como documento para imprimir y conservar. Se compone de lo que ya has registrado — el medicamento, la cantidad, cuántas colmenas, la fecha prevista y la real, quién lo anotó — junto con los recuentos de varroa del año, que son la razón por la que se trató.</p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body"><strong>Anota la cantidad mientras tratas.</strong> Es el campo que el libro de registro exige por su nombre. Es texto libre: escríbelo como se aplica el producto — <em>2 × 15 ml por colmena</em>, <em>60 g</em>, <em>una tira por cada 5 cuadros</em>.</div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body"><strong>Abre el colmenar y elige <em>Crear el libro</em></strong>, con el año que necesites. En la web está en la página del colmenar; en las apps, al final de la pantalla de tratamientos del colmenar. Un año sin tratamientos también genera un documento: «aquí no se trató» también es una respuesta.</div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p><strong>El número de colmenas se congela el día en que marcas un tratamiento como realizado.</strong> Si tratas diez colmenas en agosto y cedes tres en octubre, el libro sigue diciendo diez, porque diez es lo que trataste. Por eso marcar un tratamiento importa más de lo que parece.</p>
        </div>
        <p>Llevar un registro de medicamentos veterinarios es obligatorio para los animales productores de alimentos, y las abejas lo son. Conserva el documento impreso cinco años y muéstralo cuando te lo pidan. HivePulse produce el documento; no afirma ser el registro en sí.</p>
      </section>
    </>
  );
}
