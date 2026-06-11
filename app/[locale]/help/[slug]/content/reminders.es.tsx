import type HelpScreenshot from '@/components/HelpScreenshot';

export default function RemindersContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">¿Qué son los recordatorios de inspección?</h2>
        <p>
          Los recordatorios de inspección te notifican cuando una colmena lleva demasiado tiempo
          sin una visita según el intervalo que hayas elegido. Las inspecciones regulares son la
          base de un buen manejo de varroa — los recordatorios te ayudan a mantener el ritmo
          incluso en semanas ocupadas.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p><strong>Las notificaciones push llegarán pronto.</strong> Puedes configurar tus preferencias ahora y se guardarán. Las notificaciones comenzarán a llegar una vez que se active la infraestructura push.</p>
        </div>
        <Screenshot caption="Sección de recordatorios de inspección en Ajustes con el interruptor y el selector de intervalo" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Configurar recordatorios</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abrir Ajustes</strong>
              <p>Toca la pestaña Ajustes en la navegación inferior de iOS o Android.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Desplázate hasta Recordatorios de inspección</strong>
              <p>Activa el interruptor para habilitar los recordatorios.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Establece el intervalo de recordatorio</strong>
              <p>Elige cuántos días después de la última inspección quieres recibir un recordatorio. Una elección habitual es 7 días durante la temporada activa.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Establece la ventana de temporada</strong>
              <p>Elige los meses en los que los recordatorios deben estar activos (p. ej. abril–septiembre en climas templados). Fuera de esta ventana no se envían recordatorios — no es necesario inspeccionar una colonia invernada cada semana.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Toca Guardar ajustes de recordatorio</strong>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Ajustes de recordatorio explicados</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Intervalo de recordatorio</div>
            <div className="help-stat-card-desc">
              Número de días después de la inspección más reciente antes de que se active un recordatorio.
              Opciones habituales: 7 días (semanal) para el manejo activo de varroa, 14 días para
              apicultores de mano ligera, 21–28 días para apicultores naturales.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Inicio de temporada</div>
            <div className="help-stat-card-desc">
              El primer mes de la temporada activa de inspección. Los recordatorios no se activarán antes de este mes.
              En Europa del Norte suele ser abril o mayo.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Fin de temporada</div>
            <div className="help-stat-card-desc">
              El último mes de la temporada activa. Después de este mes los recordatorios se silencian
              hasta el inicio de la siguiente temporada. En Europa del Norte suele ser agosto o septiembre.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Consejos</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Ajusta la ventana de temporada según tu clima local — no es necesario que te recuerden inspeccionar una colonia en invierno.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Durante la ventana crítica de tratamiento pre-invernal de varroa (generalmente agosto–septiembre), considera reducir temporalmente tu intervalo a 7 días para mantenerte al día con los recuentos de ácaros.</p>
        </div>
      </section>
    </>
  );
}
