import type HelpScreenshot from '@/components/HelpScreenshot';

export default function MovingHivesContent(_: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Llevar las colmenas a la floración</h2>
        <p>
          Los apicultores trashumantes llevan sus colmenas adonde algo está en flor: acacia, colza, abeto, brezo. El
          traslado es una sola acción: eliges las colmenas, el nuevo lugar, el día y la flora. Cada traslado se guarda,
          así que siempre ves dónde ha estado una colmena y cuándo.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Trasladar colmenas</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abre el colmenar donde están las colmenas</strong>
              <p>Toca <em>Trasladar colmenas</em> (las dos flechas de la barra superior; en la web, el botón de la página del colmenar).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Elige las colmenas</strong>
              <p>Sueltas, o todas con <em>Todas las colmenas</em>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Elige el destino</strong>
              <p>
                Otro de tus colmenares, o <em>Un lugar nuevo</em> con nombre y dirección. HivePulse busca la dirección para
                poder dibujar el lugar en el mapa.
              </p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Día, flora y nota</strong>
              <p>El día es hoy si no lo cambias (no puede ser futuro). Elige una flora o escribe la tuya, y añade una nota si quieres.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            <strong>Volver de donde vinieron.</strong> Si ya se habían llevado colmenas a este colmenar, arriba del
            formulario aparecen botones como &laquo;Volver a Campo (3)&raquo;. Un toque selecciona esas colmenas y su lugar
            anterior; solo confirmas el día.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Dónde ha estado una colmena</h2>
        <p>
          Cada página de colmena muestra <em>Dónde ha estado esta colmena</em>: su recorrido en un mapa y la lista de sus
          traslados. El <em>Mapa de traslados</em> (el icono de mapa en la barra de la lista de colmenares, o en el menú del
          panel en la web) dibuja el recorrido de cada colmena, numerado parada a parada, y se puede acotar a un periodo.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Conviene saber</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Solo el propietario de un colmenar puede trasladar sus colmenas.</li>
          <li>Una colmena conserva su código QR y todas sus revisiones al trasladarse.</li>
          <li>Un colmenar vacío se queda; espera a la próxima temporada.</li>
          <li>Trasladar dentro del mismo colmenar no es posible, no hay nada que trasladar.</li>
          <li>Para el mapa, ambos lugares necesitan coordenadas o una dirección.</li>
        </ul>
      </section>
    </>
  );
}
