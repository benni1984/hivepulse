import type HelpScreenshot from '@/components/HelpScreenshot';

export default function InspectionsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">¿Qué es una inspección?</h2>
        <p>
          Una inspección es una única visita a una colmena. Cada vez que abre una colmena, registra
          lo que observa como un registro de inspección: indicadores de salud, datos de población, estado de la reina,
          y cualquier tratamiento o alimentación que haya aplicado. Con el tiempo, estos registros construyen un cuadro de
          la salud de la colonia que los gráficos y análisis de tendencias pueden revelar.
        </p>
        <Screenshot caption="Formulario de inspección abierto en una colmena, mostrando todas las secciones" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Registrar una inspección</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abrir la colmena</strong>
              <p>Navegue a la pantalla de detalles de la colmena — a través de la lista de colmenares o escaneando el código QR en la caja.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Tocar Nueva inspección</strong>
              <p>El formulario de inspección se abre. La fecha es por defecto hoy pero puede cambiarse (para registrar visitas pasadas).</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Rellenar lo que observa</strong>
              <p>Solo la fecha es obligatoria. Todos los demás campos son opcionales — registre lo que revisó y omita el resto.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">4</span>
            <div className="help-step-body">
              <strong>Guardar</strong>
              <p>La inspección se agrega al historial de la colmena y contribuye inmediatamente a los gráficos de tendencias.</p>
            </div>
          </li>
        </ol>
        <Screenshot caption="Guardando una inspección — los campos fecha y conteo de varroa son visibles" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Todos los campos de inspección explicados</h2>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Salud de la colonia</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Conteo de varroa</div>
            <div className="help-stat-card-desc">
              Número de ácaros Varroa destructor encontrados en un lavado de muestra (lavado con azúcar o alcohol de ~100 abejas).
              Este es el indicador de salud más importante — una carga alta de ácaros reduce la vida útil de las obreras, debilita la colonia y transmite virus.
            </div>
            <span className="help-stat-card-good">Bueno: 0–2 ácaros por 100</span>{' '}
            <span className="help-stat-card-warn">Actuar: 3+ ácaros por 100</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Estado de ánimo de la colonia</div>
            <div className="help-stat-card-desc">
              Cómo se comportaron las abejas durante la inspección.
              <br /><strong>Tranquila</strong> — las abejas eran dóciles, se movían despacio, pocas picaduras.<br />
              <strong>Nerviosa</strong> — las abejas estaban agitadas, difíciles de manejar.<br />
              <strong>Agresiva</strong> — las abejas atacaban activamente, múltiples picaduras.
            </div>
            <span className="help-stat-card-good">Objetivo: principalmente Tranquila</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Reina vista</div>
            <div className="help-stat-card-desc">
              Marque esto si confirmó visualmente la reina durante la inspección.
              Si ve huevos frescos pero no la reina misma, déjelo sin marcar — los huevos son solo evidencia indirecta.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Color de la reina</div>
            <div className="help-stat-card-desc">
              La codificación de color internacional SICAMM por año. Blanco (años terminados en 1/6), Amarillo (2/7),
              Rojo (3/8), Verde (4/9), Azul (5/0). Le ayuda a rastrear la edad de la reina.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Celdas de enjambre vistas</div>
            <div className="help-stat-card-desc">
              Marque esto si detectó celdas reales que se están construyendo para el enjambre. Esta es una advertencia temprana
              de que la colonia puede enjambrar en cuestión de días.
            </div>
            <span className="help-stat-card-warn">Acción requerida si está marcado</span>
          </div>
        </div>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: '24px 0 12px', color: 'var(--text-primary)' }}>Población</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Marcos de cría</div>
            <div className="help-stat-card-desc">
              Número de marcos que contienen cría (huevos, larvas o celdas operculadas). Esto mide el potencial de crecimiento de la colonia.
              Una colonia fuerte y saludable en la temporada alta generalmente llena 7–9 marcos en una Langstroth estándar.
            </div>
            <span className="help-stat-card-good">Bueno (primavera/verano): 6–9 marcos</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Marcos de miel</div>
            <div className="help-stat-card-desc">
              Número de marcos que contienen miel almacenada. Importante para monitorear las reservas de invierno.
              Una colonia necesita aproximadamente 15–20 kg de miel para sobrevivir un invierno frío.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Fuerza de la población</div>
            <div className="help-stat-card-desc">
              Escala subjetiva de 1–5 para la fuerza general de la colonia. Útil cuando desea rastrear la población relativa
              sin contar marcos individuales.
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '.95rem', fontWeight: 700, margin: '24px 0 12px', color: 'var(--text-primary)' }}>Peso &amp; tratamiento</h3>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Peso (kg)</div>
            <div className="help-stat-card-desc">
              Peso total de la colmena desde una balanza. Rastrear el peso a lo largo del tiempo muestra los flujos de néctar y
              el consumo de reservas de invierno sin abrir la colmena.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Tratamiento aplicado</div>
            <div className="help-stat-card-desc">
              Campo de texto libre para registrar cualquier tratamiento de varroa, antibiótico u otro medicamento utilizado.
              Mantener registros de tratamiento es un requisito legal en muchos países.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Alimentación realizada</div>
            <div className="help-stat-card-desc">
              Casilla para registrar que alimentó a la colonia. Use el campo Notas para especificar el tipo y cantidad.
            </div>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Tipo de alimentación</div>
            <div className="help-stat-card-desc">
              Lo que alimentó: jarabe de azúcar, candi, sustituto de polen, etc.
            </div>
          </div>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Consejos</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Registre los conteos de varroa de forma consistente usando el mismo método (lavado con azúcar o alcohol) para que el gráfico de tendencias sea comparable entre inspecciones.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Incluso una inspección parcial (solo estado de ánimo y marcos de cría) es valiosa. Los registros parciales consistentes son mejores que los registros perfectos que ocurren una vez al año.</p>
        </div>
      </section>
    </>
  );
}
