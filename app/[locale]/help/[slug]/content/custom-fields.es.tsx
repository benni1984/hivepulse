import type HelpScreenshot from '@/components/HelpScreenshot';

export default function CustomFieldsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">¿Qué son los campos personalizados?</h2>
        <p>
          Los campos personalizados le permiten agregar preguntas adicionales al formulario de inspección que no están en el
          conjunto integrado. Por ejemplo: una casilla para «enjambre artificial realizado», un número para
          «marcos de reservas», o una lista desplegable para la fuente de néctar actualmente en floración.
        </p>
        <p>
          Los campos se gestionan actualmente en el <strong>panel de control web</strong> y aparecen en el
          formulario de inspección en todas las plataformas.
        </p>
        <Screenshot caption="Página de configuración de campos personalizados mostrando una lista de campos de ámbito de usuario" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Ámbito del campo</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Ámbito de usuario</div>
            <div className="help-stat-card-desc">
              Se aplica a <strong>cada inspección en todos sus colmenares</strong>. Use para campos
              que siempre son relevantes para su práctica — p. ej. «tipo de tratamiento» o «enjambre artificial».
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Ámbito de colmenar</div>
            <div className="help-stat-card-desc">
              Se aplica solo a inspecciones <strong>dentro de un colmenar específico</strong>. Use para campos
              que solo son relevantes en una ubicación — p. ej. «proximidad a campo de colza» para un
              colmenar cerca de un campo de colza.
            </div>
          </div>
        </div>
        <p style={{ marginTop: 8 }}>
          Si un campo de ámbito de usuario y un campo de ámbito de colmenar tienen el mismo nombre, el campo de ámbito de colmenar
          tiene precedencia para las colmenas de ese colmenar.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Tipos de campo</h2>
        <div className="help-stat-grid">
          {[
            { name: 'Texto', desc: 'Una entrada de texto libre. Bueno para notas, observaciones o cualquier respuesta abierta.' },
            { name: 'Número', desc: 'Una entrada numérica. Almacenado como decimal — útil para medidas como conteos de marcos o pesos.' },
            { name: 'Booleano', desc: 'Un interruptor sí/no. Ideal para acciones realizadas o no: «alimentado hoy», «nuevo panal construido».' },
            { name: 'Fecha', desc: 'Un selector de fecha. Use para registrar eventos específicos — «fecha del último tratamiento», «reina introducida el».' },
            { name: 'Selección', desc: 'Una lista desplegable con sus propias opciones. Útil para datos categóricos — «fuente de néctar», «producto de tratamiento».' },
          ].map(f => (
            <div className="help-stat-card" key={f.name}>
              <div className="help-stat-card-name">{f.name}</div>
              <div className="help-stat-card-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Crear un campo personalizado</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Ir a Definiciones de campo</strong>
              <p>En el panel de control web, navegue a <strong>Dashboard → Definiciones de campo</strong>.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Elegir el destino</strong>
              <p>Los campos de <strong>Colmena</strong> aparecen en el formulario de detalles de la colmena. Los campos de <strong>Inspección</strong> aparecen en el formulario de inspección — esta es la elección más común.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Elegir el ámbito</strong>
              <p>Usuario (todos los colmenares) o Colmenar (un colmenar específico).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Nombrar el campo y elegir un tipo</strong>
              <p>Para campos de selección, también ingrese las opciones del desplegable (una por línea).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">5</span>
            <div className="help-step-body">
              <strong>Guardar</strong>
              <p>El campo aparece inmediatamente en el formulario de inspección para los colmenares relevantes.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Creando un nuevo campo personalizado — nombre, tipo y ámbito están seleccionados" />
      </section>
    </>
  );
}
