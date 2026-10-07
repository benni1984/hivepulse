import type HelpScreenshot from '@/components/HelpScreenshot';

export default function SharingContent(_: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Trabajar juntos en un colmenar</h2>
        <p>
          Dos apicultores pueden cuidar juntos el mismo colmenar, o colmenas sueltas. Invitas a la otra persona con su
          dirección de correo; cuando acepta, ambos veis las mismas colmenas y revisiones, y ambos podéis anotar
          revisiones, editar colmenas y añadirlas.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            <strong>Lo que queda con el propietario.</strong> Quien creó el colmenar es su propietario. Solo él puede
            eliminar un colmenar o una colmena, hacer público un colmenar en el mapa de la comunidad, trasladar colmenas e
            invitar o quitar personas. Un colaborador siempre puede salir por su cuenta.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Compartir todo el colmenar o colmenas sueltas</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Un colmenar</strong> comparte el colmenar y todas sus colmenas, también las que añadas más tarde.</li>
          <li>
            <strong>Una sola colmena</strong> comparte solo esa colmena. La otra persona ve el nombre de su colmenar para
            orientarse, pero ninguna de las demás colmenas, y no puede editar el colmenar ni añadirle colmenas.
          </li>
        </ul>
        <p>Para compartir algunas colmenas de un colmenar y otras no, ponlas en un colmenar aparte y comparte ese.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Invitar a alguien</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abre el colmenar o la colmena</strong>
              <p>En la web, <em>Trabajar juntos</em> en la página; en las apps, toca el icono de personas de la barra superior.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Escribe el correo y envía</strong>
              <p>La invitación queda <em>pendiente</em> hasta que se acepta. Puedes retirarla desde la misma pantalla.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Aceptar una invitación</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>
            <strong>Ya tienes cuenta</strong> con esa dirección: la invitación aparece arriba del todo en tu lista de
            colmenares con <em>Aceptar</em> y <em>Rechazar</em>. Un correo también te avisa.
          </li>
          <li>
            <strong>Aún no tienes cuenta:</strong> el correo trae un enlace. Ábrelo, regístrate o inicia sesión con esa
            dirección y acepta. En las apps, toca el icono de sobre en la barra de la lista de colmenares
            (<em>Usar un enlace de invitación</em>) y pega el enlace.
          </li>
        </ul>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Dejar de compartir</h2>
        <p>
          El propietario quita a una persona en la misma pantalla <em>Trabajar juntos</em>; el colmenar o la colmena
          desaparece al instante de la lista de la otra persona. Un colaborador puede salir por su lado. Las revisiones que
          anotaste se quedan en la colmena.
        </p>
      </section>
    </>
  );
}
