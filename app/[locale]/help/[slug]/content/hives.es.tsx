import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HivesContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">¿Qué es un registro de colmena?</h2>
        <p>
          Un registro de colmena representa una colonia física. Tiene un nombre, un tipo y una etiqueta de código QR opcional.
          Todo el historial de inspecciones está adjunto al registro de colmena, por lo que puede ver
          la tendencia completa de salud de esa colonia a lo largo del tiempo.
        </p>
        <Screenshot android="/docs/screenshots/android-hive-detail.png" web="/docs/screenshots/hive-detail-web.png" caption="Pantalla de detalles de la colmena mostrando el tipo, la fecha de la última inspección y la lista de inspecciones" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tipos de colmena</h2>
        <div className="help-stat-grid">
          {[
            { name: 'Langstroth', desc: 'La colmena más común en América del Norte e internacionalmente. Alzas profundas y medianas con cuadros desmontables.' },
            { name: 'Dadant', desc: 'Popular en Europa continental. Cámara de cría más grande que la Langstroth, diseñada para colonias grandes.' },
            { name: 'Top Bar', desc: 'Colmena horizontal donde las abejas construyen los panales hacia abajo desde listones móviles. Común en África oriental y entre apicultores naturales.' },
            { name: 'Warré', desc: 'Colmena de apilamiento vertical basada en la construcción natural de panales. Filosofía de intervención mínima.' },
            { name: 'Otro', desc: 'Use para cualquier tipo de colmena no listado — colonias núcleo, colmenas de observación, etc.' },
          ].map(h => (
            <div className="help-stat-card" key={h.name}>
              <div className="help-stat-card-name">{h.name}</div>
              <div className="help-stat-card-desc">{h.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 8 }}>
          Elegir el tipo correcto no afecta la funcionalidad — es una etiqueta para ayudarle a
          distinguir sus colmenas en la lista.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Crear una colmena</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abrir un colmenar</strong>
              <p>Toque el nombre del colmenar para abrir su vista detallada.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tocar el botón + (Nueva colmena)</strong>
              <p>Aparece un formulario solicitando un nombre y tipo de colmena.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Elegir un nombre</strong>
              <p>Use cualquier esquema de nombres: «Colmena 1», «Caja azul», «Pradera sur A».</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Seleccionar un tipo de colmena</strong>
              <p>Elija de la lista anterior. Puede cambiarlo más tarde desde la pantalla de detalles de la colmena.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Asignar un código QR (opcional)</strong>
              <p>Después de guardar, abra la colmena y toque <em>Asignar QR</em> para vincular un token QR impreso.
              Vea <a href="qr-codes">Códigos QR</a> para el flujo completo.</p>
            </div>
          </li>
        </ol>
        <Screenshot src="/docs/screenshots/hive-create-form.png" caption="Formulario de nueva colmena con campo de nombre y selector de tipo de colmena" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Ver una colmena</h2>
        <p>
          La pantalla de detalles de la colmena muestra:
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Tipo de colmena y fecha en que se agregó</li>
          <li>Fecha de la última inspección</li>
          <li>Historial completo de inspecciones, la más reciente primero</li>
          <li>Un botón para iniciar una nueva inspección</li>
          <li>En la web: pestañas para Inspecciones, Estadísticas y Campos personalizados</li>
        </ul>
        <Screenshot src="/docs/screenshots/hive-detail-web.png" caption="Página de detalles de la colmena en la web mostrando la pestaña de inspecciones y metadatos de la colmena" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Consejos</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Dé a cada colmena un nombre corto y único. Cuando tiene muchas colmenas, nombres como «A1» o «Jardín superior» son más fáciles de leer en la lista que «Colmena 1», «Colmena 2», «Colmena 3».</p>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Eliminar una colmena elimina permanentemente todo el historial de inspecciones de esa colonia. Exporte sus datos antes de eliminar si desea conservar los registros.</p>
        </div>
      </section>
    </>
  );
}
