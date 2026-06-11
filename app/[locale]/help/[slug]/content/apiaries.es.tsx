import type HelpScreenshot from '@/components/HelpScreenshot';

export default function AviariesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">¿Qué es un colmenar?</h2>
        <p>
          Un colmenar es una ubicación nombrada que agrupa una o más colmenas. Representa
          un lugar físico — su jardín, un campo, un tejado — donde viven sus colonias.
          Cada colmena en HivePulse pertenece exactamente a un colmenar.
        </p>
        <p>
          Los colmenares pueden hacerse <strong>públicos</strong>, lo que agrega un pin en el mapa comunitario
          y contribuye sus datos de inspección anonimizados a las estadísticas de toda la plataforma que
          todos los apicultores pueden ver en la pantalla de Miembros.
        </p>
        <Screenshot src="/docs/screenshots/dashboard-apiary-list.png" caption="Lista de colmenares en el panel de control web mostrando dos colmenares con recuento de colmenas" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Crear un colmenar</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abrir la lista de colmenares</strong>
              <p>En la web vaya a <strong>/dashboard</strong>. En iOS o Android es la primera pantalla después del inicio de sesión.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tocar el botón +</strong>
              <p>Se abre un formulario de creación con los siguientes campos.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Rellenar los detalles</strong>
              <p><strong>Nombre</strong> (obligatorio) — una etiqueta corta como «Jardín de casa» o «Borde del bosque».<br/>
              <strong>Descripción</strong> — notas opcionales visibles solo para usted.<br/>
              <strong>Dirección</strong> — dirección de texto libre opcional.<br/>
              <strong>Latitud &amp; Longitud</strong> — coordenadas decimales para el pin en el mapa. Si deja estos campos en blanco, el colmenar no aparecerá en el mapa aunque se haga público.<br/>
              <strong>Hacer público</strong> — marque para compartir la ubicación y estadísticas anonimizadas con la comunidad.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Guardar</strong>
              <p>El nuevo colmenar aparece inmediatamente en su lista.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/apiary-create-form.png" caption="Formulario de creación de colmenar mostrando los campos nombre, descripción y GPS" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Colmenares públicos vs privados</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Privado (predeterminado)</div>
            <div className="help-stat-card-desc">
              Solo usted puede ver el colmenar, sus colmenas y todos los datos de inspección. Nada se comparte con la comunidad.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Público</div>
            <div className="help-stat-card-desc">
              Un pin aparece en el mapa comunitario en sus coordenadas GPS. Sus datos de inspección
              contribuyen a las estadísticas de toda la plataforma (solo promedios — los registros individuales nunca se exponen).
              No se publica ninguna información que identifique al usuario.
            </div>
          </div>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Sus coordenadas GPS se almacenan con <strong>precisión a nivel de ciudad</strong> — el pin exacto se redondea para proteger su privacidad.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Eliminar un colmenar</h2>
        <p>
          En la web, abra la página de detalles del colmenar y desplácese hasta la zona de peligro. En móvil, deslice hacia la izquierda
          en la fila del colmenar. <strong>Un colmenar solo puede eliminarse cuando no contiene colmenas.</strong> Elimine
          primero todas las colmenas y luego el colmenar.
        </p>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Eliminar un colmenar es permanente — todas las colmenas y su historial de inspecciones se perderán. Exporte sus datos primero si necesita una copia.</p>
        </div>
      </section>
    </>
  );
}
