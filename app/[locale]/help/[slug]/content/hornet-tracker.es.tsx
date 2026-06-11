import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HornetTrackerContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">¿Por qué rastrear avispones asiáticos?</h2>
        <p>
          <em>Vespa velutina</em> (el avispón asiático) es un depredador invasivo que caza abejas melíferas
          en las entradas de las colmenas, reduciendo drásticamente el forrajeo y la fortaleza de las colonias. La detección temprana y
          la destrucción de nidos son las medidas de control más eficaces. El Rastreador de Avispones de HivePulse
          permite a cualquier ciudadano — sin necesidad de cuenta — contribuir avistamientos, y permite a los apicultores
          monitorear la densidad de nidos en su área.
        </p>
        <Screenshot caption="Página de inicio del Rastreador de Avispones mostrando estadísticas agregadas y enlaces de acción" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Reportar una captura</h2>
        <p>
          Una «captura» es el número de avispones capturados en una trampa durante un período de tiempo.
          Los reportes no requieren cuenta.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ir a Avispones → Reportar</strong>
              <p>Navegue a <strong>/hornets/report</strong> en la web.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Ingresar su conteo de captura y ubicación opcional</strong>
              <p>Agregar coordenadas GPS coloca su captura en el mapa, ayudando a las autoridades a rastrear patrones de propagación.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Enviar</strong>
              <p>Su reporte se agrega inmediatamente al total de capturas comunitarias.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Formulario de reporte de captura con entrada de conteo y campos GPS opcionales" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Reportar un nido</h2>
        <p>
          Los reportes de nidos incluyen una ubicación GPS y estado actual (Encontrado / Destrucción ordenada / Destruido).
          Los nidos confirmados aparecen como pines rojos en el mapa de Avispones.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ir a Avispones → Reportar</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Cambiar a la pestaña Nido</strong>
              <p>Ingresar latitud, longitud y estado del nido.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Enviar</strong>
              <p>El nido aparece en el mapa para que otros apicultores y autoridades locales lo vean.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Avistamientos fotográficos &amp; votación comunitaria</h2>
        <p>
          El feed de avistamientos comunitarios permite a los usuarios enviar una foto de un posible avispón asiático
          para que otros lo verifiquen. La identificación errónea es común (los avispones asiáticos se confunden frecuentemente
          con avispones europeos y sírfidos), por lo que la votación comunitaria ayuda a filtrar los reportes precisos.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ir a Avispones → Avistamientos comunitarios</strong>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Navegar por el feed</strong>
              <p>Cada tarjeta muestra la foto, la fecha de envío y el recuento actual de votos Sí/No.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Votar Sí o No</strong>
              <p>Emita un voto por avistamiento. Los administradores pueden anular el estado a Confirmado o Rechazado.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Enviar su propia foto</strong>
              <p>Toque el botón +, suba una foto y agregue datos de ubicación opcionales.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Feed de avistamientos comunitarios mostrando tarjetas de fotos con recuentos de votos" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Leer las estadísticas</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Total capturado</div>
            <div className="help-stat-card-desc">Todos los avispones reportados como capturados en todos los reportes de trampas en toda la plataforma. Un total creciente señala una temporada activa.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Nidos encontrados</div>
            <div className="help-stat-card-desc">Número de reportes de nidos enviados. Altos recuentos de nidos en su región significan un mayor riesgo de depredación en su colmenar.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Nidos destruidos</div>
            <div className="help-stat-card-desc">Nidos con estado «Destruido». Rastrea la efectividad de los esfuerzos de control locales.</div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Avistamientos pendientes</div>
            <div className="help-stat-card-desc">Avistamientos fotográficos comunitarios en espera de suficientes votos para confirmar o rechazar. Ayude a reducir este número votando sobre avistamientos abiertos.</div>
          </div>
        </div>
      </section>
    </>
  );
}
