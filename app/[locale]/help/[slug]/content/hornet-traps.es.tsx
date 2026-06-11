import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HornetTrapsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">¿Qué es una trampa con nombre?</h2>
        <p>
          Una trampa con nombre es una trampa física para avispones asiáticos que ha sido registrada en HivePulse.
          Cada trampa recibe un <strong>código de acceso de 8 caracteres</strong>. Cualquiera que conozca el código —
          usted, un vecino, un voluntario, un investigador de campo — puede registrar conteos diarios de capturas para
          esa trampa sin necesidad de una cuenta HivePulse.
        </p>
        <p>
          Las trampas con nombre facilitan la gestión de redes de monitoreo distribuidas: registre trampas en
          múltiples ubicaciones, comparta los códigos de acceso con asociaciones apícolas locales y
          recopile datos de captura de la comunidad.
        </p>
        <Screenshot caption="Pantalla de detalles de la trampa mostrando el código de acceso, historial de capturas y botón de registro" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Registrar una trampa</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ir a Avispones → Trampas</strong>
              <p>Navegue a <strong>/hornets/traps</strong> en la web, o abra la pantalla de Trampas de Avispones en móvil.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tocar Registrar nueva trampa</strong>
              <p>Ingrese un nombre (p. ej. «Cerca norte»), coordenadas GPS y una descripción opcional.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Guardar</strong>
              <p>Su trampa está registrada y se genera un código de acceso de 8 caracteres. Anótelo o compártalo.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Formulario de registro de trampa mostrando nombre, GPS y el código de acceso generado" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Registrar una captura diaria</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ingresar el código de acceso</strong>
              <p>En la página de Trampas, escriba el código de 8 caracteres en el cuadro de búsqueda. La trampa se abre sin necesidad de inicio de sesión.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tocar Registrar captura de hoy</strong>
              <p>Ingrese el número de avispones capturados desde la última revisión.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Guardar</strong>
              <p>Solo se almacena una captura por trampa por día — volver a enviar hoy actualiza el registro existente.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Encontrar trampas cerca de usted</h2>
        <p>
          La pestaña <strong>Cercanas</strong> en la página de Trampas muestra trampas registradas dentro de 50 metros
          de su ubicación GPS actual. Esto es útil cuando está en el campo y desea registrar
          una captura para una trampa que gestiona pero no recuerda el código de acceso.
        </p>
        <Screenshot caption="Lista de trampas cercanas mostrando dos trampas dentro de 50 m con distancias" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Mapa de trampas</h2>
        <p>
          Todas las trampas registradas aparecen como pines azules en el mapa de Avispones en <strong>/hornets/map</strong>.
          Esto da a las asociaciones apícolas locales una visión general de las brechas de cobertura — áreas sin trampa
          y alta densidad de nidos que se beneficiarían de la colocación de una nueva trampa.
        </p>
      </section>
    </>
  );
}
