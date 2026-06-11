import type HelpScreenshot from '@/components/HelpScreenshot';

export default function AccountContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Editar tu perfil</h2>
        <p>
          Tu perfil almacena tu nombre de visualización y el idioma preferido. El nombre de visualización
          aparece en el panel de administración si tu cuenta tiene privilegios de administrador. El ajuste
          de idioma controla qué idioma usan las aplicaciones móviles para las etiquetas de la interfaz.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Web:</strong> Ve a <strong>Panel → Perfil</strong> (<code>/dashboard/profile</code>).
              <strong> Móvil:</strong> Abre la pestaña Ajustes.
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Edita tu nombre de visualización</strong>
              <p>Escribe el nuevo nombre y toca Guardar perfil / Guardar.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Cambiar idioma</strong>
              <p>Selecciona inglés, francés, alemán o español en el selector de idioma.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Sección de perfil en Ajustes mostrando el campo de nombre y el selector de idioma" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Cambiar tu contraseña</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abre la sección Cambiar contraseña</strong>
              <p>En web: Panel → Perfil. En móvil: Ajustes → desplázate hacia abajo hasta Cambiar contraseña.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Introduce tu contraseña actual</strong>
              <p>Esto confirma que eres el propietario de la cuenta.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Introduce y confirma tu nueva contraseña</strong>
              <p>Mínimo 8 caracteres.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Toca Cambiar contraseña</strong>
              <p>Permaneces conectado. Todas las demás sesiones activas siguen siendo válidas.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>¿Olvidaste tu contraseña actual? Usa el enlace <strong>¿Olvidaste tu contraseña?</strong> en la pantalla de inicio de sesión para recibir un enlace de restablecimiento por correo electrónico.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Eliminar tu cuenta</h2>
        <p>
          Eliminar tu cuenta borra permanentemente tu dirección de correo electrónico, nombre de visualización,
          todos los apiarios, todas las colmenas y todos los registros de inspección. Esta acción <strong>no se puede deshacer</strong>.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Exporta tus datos primero</strong>
              <p>Descarga una exportación JSON o CSV de cada apiario si quieres conservar tus registros.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Abre la Zona de peligro</strong>
              <p>En web: Panel → Perfil → Zona de peligro. En móvil: Ajustes → desplázate hasta el final.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Toca Eliminar cuenta y confirma</strong>
              <p>Un diálogo de confirmación explica qué se eliminará. Confirma para continuar.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Tus datos de inspección pueden haber contribuido a las estadísticas de la comunidad. Eliminar tu cuenta los excluye de futuros agregados, pero las estadísticas históricas ya calculadas no se recalculan retroactivamente.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Cerrar sesión</h2>
        <p>
          Toca <strong>Cerrar sesión</strong> en Ajustes (móvil) o en el menú desplegable de la esquina superior derecha (web).
          Tu token de sesión se revoca en el servidor. Serás redirigido a la pantalla de inicio de sesión.
          Tus datos se conservan — cerrar sesión no elimina nada.
        </p>
      </section>
    </>
  );
}
