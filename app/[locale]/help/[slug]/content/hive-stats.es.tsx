import type HelpScreenshot from '@/components/HelpScreenshot';

export default function HiveStatsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">¿Qué son las estadísticas de colmena?</h2>
        <p>
          Las estadísticas de colmena convierten su historial de inspecciones en gráficos y números resumidos, facilitando
          detectar tendencias que pasaría por alto al revisar registros individuales. Las estadísticas están disponibles en la pantalla de
          detalles de la colmena en todas las plataformas.
        </p>
        <Screenshot android="/docs/screenshots/android-hive-stats.png" web="/docs/screenshots/hive-stats-overview.png" caption="Página de estadísticas de la colmena mostrando el gráfico de tendencia de varroa y la distribución del estado de ánimo" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Filtro de período de tiempo</h2>
        <p>
          Todos los gráficos y números se pueden filtrar por período: <strong>30 días</strong>, <strong>90 días</strong>,
          <strong>365 días</strong>, o <strong>Todo el tiempo</strong>. Use períodos más cortos para centrarse en una temporada actual;
          use Todo el tiempo para ver el historial completo de una colonia.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Cada estadística explicada</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-chart-line" style={{ marginRight: 6, color: '#f59e0b' }} />Tendencia del conteo de varroa</div>
            <div className="help-stat-card-desc">
              Un gráfico de líneas de sus conteos de varroa a lo largo del tiempo. El eje x es la fecha de inspección; el eje y
              son ácaros por 100 abejas. Observe la pendiente: una línea ascendente significa que la carga de ácaros está creciendo
              y puede que pronto se necesite tratamiento.
            </div>
            <span className="help-stat-card-good">Objetivo: línea plana cerca de 0–2</span>{' '}
            <span className="help-stat-card-warn">Tendencia ascendente = tratar urgentemente</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-face-smile" style={{ marginRight: 6, color: '#22c55e' }} />Distribución del estado de ánimo</div>
            <div className="help-stat-card-desc">
              Un gráfico de rosquilla mostrando la proporción de inspecciones Tranquila, Nerviosa y Agresiva.
              La nerviosidad o agresividad persistente puede indicar ausencia de reina, enfermedad o problemas genéticos
              que justifican la sustitución de la reina.
            </div>
            <span className="help-stat-card-good">Objetivo: &gt;80% Tranquila</span>{' '}
            <span className="help-stat-card-warn">&gt;20% Agresiva = investigar</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-crown" style={{ marginRight: 6, color: '#eab308' }} />Tasa de reina vista</div>
            <div className="help-stat-card-desc">
              Porcentaje de inspecciones en las que confirmó visualmente la reina. Una tasa constantemente baja
              puede significar que la reina es difícil de ver (normal para reinas oscuras) o que la colonia
              se ha quedado sin reina.
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-egg" style={{ marginRight: 6, color: '#8b5cf6' }} />Marcos de cría</div>
            <div className="help-stat-card-desc">
              Número promedio de marcos de cría registrados por inspección en el período seleccionado.
              Rastrea el crecimiento de la colonia durante la temporada — espere un aumento en primavera, un pico en
              comienzos del verano, luego un declive hacia el otoño.
            </div>
            <span className="help-stat-card-good">Temporada alta: 6–9 marcos</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-clock" style={{ marginRight: 6, color: '#64748b' }} />Eventos de celdas de enjambre</div>
            <div className="help-stat-card-desc">
              Número de inspecciones donde se reportaron celdas de enjambre. Un recuento alto indica una
              colonia propensa a enjambrar que podría beneficiarse de manejo preventivo (división, proveer más espacio).
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name"><i className="fas fa-calendar" style={{ marginRight: 6, color: '#0ea5e9' }} />Inspecciones por período</div>
            <div className="help-stat-card-desc">
              Número total de inspecciones registradas en el período de tiempo seleccionado. Una frecuencia de inspección consistente
              (cada 7–14 días en temporada alta) brinda los datos de tendencias más confiables.
            </div>
          </div>
        </div>

        <Screenshot src="/docs/screenshots/hive-stats-overview.png" caption="Gráfico de líneas de tendencia de varroa con fechas de inspección en el eje x" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Leer la tendencia de varroa — qué hacer</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Línea plana cerca de 0–1</div>
            <div className="help-stat-card-desc">La carga de ácaros está bajo control. Continuar el monitoreo regular cada 3–4 semanas.</div>
            <span className="help-stat-card-good">No se necesita acción</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Aumento lento (1–3)</div>
            <div className="help-stat-card-desc">Aumento estacional natural. Monitorear más frecuentemente (cada 2 semanas) y planificar el tratamiento antes de que suba más.</div>
            <span className="help-stat-card-warn">Monitorear de cerca</span>
          </div>
          <div className="help-stat-card">
            <div className="help-stat-card-name">Por encima de 3 o aumento pronunciado</div>
            <div className="help-stat-card-desc">Umbral de tratamiento alcanzado. Aplicar inmediatamente un tratamiento de varroa aprobado. Las colonias sin tratar a este nivel típicamente colapsan antes del invierno.</div>
            <span className="help-stat-card-warn">Tratar inmediatamente</span>
          </div>
        </div>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>Los umbrales varían según el país, la temporada y el método. Siga siempre las directrices de su asociación apícola nacional para los umbrales de tratamiento.</p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Consejos para mejores estadísticas</h2>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Las estadísticas mejoran dramáticamente con datos consistentes. Incluso registrando solo el conteo de varroa y el estado de ánimo en cada visita, obtendrá líneas de tendencia significativas después de cuatro o cinco inspecciones.</p>
        </div>
        <div className="help-callout tip">
          <i className="fas fa-lightbulb" />
          <p>Use el mismo método de muestreo cada vez. Alternar entre lavado con azúcar y alcohol a mitad de temporada hace que la línea de tendencia sea más difícil de interpretar.</p>
        </div>
      </section>
    </>
  );
}
