import type HelpScreenshot from '@/components/HelpScreenshot';

export default function GettingStartedContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">¿Qué es HivePulse?</h2>
        <p>
          HivePulse es una plataforma de revisión apícola y comunidad para iOS, Android y la web.
          Le permite registrar cada visita a la colmena — conteos de varroa, comportamiento de la colonia, avistamientos de reina, cuadros de cría,
          y más — y convierte esos datos en gráficos y análisis de tendencias a lo largo del tiempo.
        </p>
        <p>
          Cada revisión que registre también contribuye (de forma anónima) a las estadísticas de toda la plataforma
          que ayudan a la comunidad apícola más amplia a comprender las tendencias de salud de las colonias en las regiones.
        </p>
        <Screenshot src="/docs/screenshots/dashboard-apiary-list.png" caption="Panel de control de HivePulse mostrando la vista general del colmenar y la lista de colmenas" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Las tres aplicaciones</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-globe" style={{ marginRight: 6 }} />Panel de control web</div>
            <div className="help-stat-card-desc">
              Panel de control completo en <strong>hivepulse.multihead.de</strong>. Ideal para gestionar colmenares,
              ver gráficos detallados, generar lotes de códigos QR y exportar datos. Funciona en cualquier navegador.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fab fa-apple" style={{ marginRight: 6 }} />Aplicación iOS</div>
            <div className="help-stat-card-desc">
              Aplicación iPhone nativa optimizada para uso en campo. Escanee un código QR en una colmena para abrirla instantáneamente,
              registrar una revisión y ver estadísticas — todo sin abrir un navegador.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fab fa-android" style={{ marginRight: 6 }} />Aplicación Android</div>
            <div className="help-stat-card-desc">
              Aplicación Android nativa con el mismo diseño orientado al campo. Compatible con escaneo de códigos QR mediante la cámara
              y funciona en teléfonos con Android 8 (API 26) y superior.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Crear su cuenta</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abrir la página de registro</strong>
              <p>Vaya a <strong>/dashboard/register</strong> en la web, o toque <em>Crear cuenta</em> en la pantalla de inicio de sesión de las aplicaciones móviles.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Ingresar sus datos</strong>
              <p>Proporcione una dirección de correo electrónico, un nombre para mostrar, su idioma preferido (inglés, francés, alemán, español o polaco) y una contraseña de al menos 8 caracteres.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Comenzar a agregar colmenares</strong>
              <p>Después del registro, accede a la lista de colmenares. Toque el botón <strong>+</strong> para crear su primer colmenar.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/register-form.png" caption="Formulario de registro en el panel de control web" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Primeros pasos recomendados</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Crear un colmenar</strong>
              <p>Asígnele un nombre y opcionalmente una posición GPS para que aparezca en el mapa comunitario.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Agregar sus colmenas</strong>
              <p>Cree una entrada por colmena física. Elija el tipo de colmena que corresponde a su equipo.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Generar e imprimir códigos QR</strong>
              <p>Desde la web, genere un lote de códigos QR e imprima el PDF. Coloque una etiqueta en cada colmena.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Registrar su primera revisión</strong>
              <p>Escanee el código QR con su teléfono, toque <em>Nueva revisión</em> y rellene lo que observe.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Registre las revisiones de forma consistente — aunque solo anote el conteo de varroa — y HivePulse creará gráficos de tendencias significativos después de algunas visitas.</p>
        </div>
      </section>
      <section className="help-section">
        <h2 className="help-section-title">Tours guiados</h2>
        <p>
          En la web un tour no describe la app — señala el botón de verdad en la pantalla de verdad
          y espera a que lo pulses. La página se queda donde está, iluminada alrededor del único
          control que importa, con una frase que dice por qué es ese.
        </p>
        <p>
          Hay nueve: una primera colonia desde una cuenta vacía, las pegatinas QR, registrar sin
          cobertura, las trampas para avispas asiáticas, el año apícola, los tratamientos, compartir
          un colmenar, tus propios campos de revisión, y la trashumancia. Cada función lleva una
          pequeña <strong>?</strong> ámbar junto a su título que empieza el tour correspondiente, y{' '}
          <strong>Ajustes → Tours guiados</strong> los lista todos. Ninguno se gasta por haberlo
          visto: vuelve a empezarlo un año después, tantas veces como quieras.
        </p>
        <p>
          Un tour nunca te atrapa. Escape lo deja, cada paso tiene una salida, y si el control que
          busca no está en la pantalla lo dice, en vez de oscurecer la página alrededor de nada.
        </p>
        <p>
          Las apps de iPhone y Android tienen los mismos nueve, y funcionan igual: la pantalla se
          oscurece alrededor de un control de verdad y espera a que lo pulses. Abrir la app por
          primera vez ya no sustituye la lista de colmenares por una presentación — aterriza en la
          lista de colmenares, y el primer paso señala el botón ámbar.{' '}
          <strong>Ajustes → Tours guiados</strong> los lista todos allí también, y empezar uno te
          lleva primero a la pantalla en la que arranca.
        </p>
      </section>


      <section className="help-section">
        <h2 className="help-section-title">Orientarse en las apps</h2>
        <p>
          Las apps de iPhone y Android están organizadas igual.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Pestañas abajo:</strong> Colmenares, Escanear, Avispas, Miembros, Ajustes.</li>
          <li><strong>Barra de la lista de colmenares:</strong> estadísticas, lotes de QR, mapa de traslados, año del apicultor.</li>
          <li><strong>Crear algo</strong> (un colmenar, una revisión, un lote de QR, un campo propio) es siempre el botón ámbar de abajo a la derecha.</li>
          <li><strong>Los ajustes</strong> incluyen esta ayuda, las notas de versión con la lista completa de funciones y el recorrido guiado.</li>
        </ul>
      </section>
    </>
  );
}
