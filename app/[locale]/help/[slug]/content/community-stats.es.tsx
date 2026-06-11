import type HelpScreenshot from '@/components/HelpScreenshot';

export default function CommunityStatsContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">¿Qué son las estadísticas comunitarias?</h2>
        <p>
          Las estadísticas comunitarias muestran números agregados de toda la plataforma calculados a partir de todos los colmenares públicos
          en HivePulse. Le permiten comparar el rendimiento de sus colmenas con apicultores de la
          comunidad más amplia sin exponer los datos individuales de nadie.
        </p>
        <p>
          La pantalla de estadísticas comunitarias está disponible en <strong>Miembros</strong> en todas las plataformas.
          Las cuatro tarjetas de estadísticas en vivo son visibles para todos; el desglose detallado es una
          <strong> función de Supporter</strong>.
        </p>
        <Screenshot caption="Pantalla de Miembros mostrando las cuatro tarjetas de estadísticas comunitarias" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Las cuatro estadísticas comunitarias explicadas</h2>
        <div className="help-stat-grid">
          <div className="help-stat-card">
            <div className="help-stat-card-name">Conteo varroa promedio</div>
            <div className="help-stat-card-desc">
              El conteo de varroa promedio (ácaros por 100 abejas) en todas las inspecciones públicas que
              registraron una medición de varroa. Le da un punto de referencia regional: si su conteo es
              consistentemente más alto que el promedio comunitario, su colonia puede necesitar tratamiento antes
              de lo habitual en su área.
            </div>
            <span className="help-stat-card-good">Promedio comunitario por debajo de 2 = temporada saludable</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">% Buen estado de ánimo</div>
            <div className="help-stat-card-desc">
              Porcentaje de inspecciones en todos los colmenares públicos calificadas como «Tranquila». Una alta
              tasa de calma comunitaria sugiere buena genética regional y condiciones de bajo estrés
              (buen forraje, baja presión de plagas). Una tendencia decreciente del buen estado de ánimo puede señalar una temporada difícil
              para las abejas en su región.
            </div>
            <span className="help-stat-card-good">Por encima del 75% = una temporada tranquila en toda la comunidad</span>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Marcos de cría promedio</div>
            <div className="help-stat-card-desc">
              Número promedio de marcos de cría registrados en todas las inspecciones públicas. En primavera,
              este número sube; en otoño baja. Comparar su recuento de marcos de cría con este
              promedio puede revelar si sus colonias se están desarrollando más rápido o más lento que otras
              en la comunidad.
            </div>
          </div>

          <div className="help-stat-card">
            <div className="help-stat-card-name">Intervalo de inspección promedio</div>
            <div className="help-stat-card-desc">
              Número promedio de días entre inspecciones consecutivas, promediado por colmena en todos los
              colmenares públicos. Intervalos más cortos significan apicultores más atentos — y más datos
              para el análisis de tendencias. El promedio comunitario le da una idea de los hábitos de inspección locales.
            </div>
            <span className="help-stat-card-good">7–14 días en temporada activa</span>
          </div>
        </div>
        <Screenshot caption="Las cuatro tarjetas de estadísticas con datos comunitarios en vivo" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Contribuir a las estadísticas comunitarias</h2>
        <p>
          Sus inspecciones contribuyen a las estadísticas comunitarias automáticamente cuando su colmenar está configurado
          como <strong>público</strong>. No se requiere ninguna acción adicional. Los registros individuales
          nunca son visibles para otros usuarios — solo se publican agregados (medias, porcentajes).
        </p>
        <p>
          Para hacer público un colmenar, abra su página de detalles y active <em>Hacer público</em>.
          Puede volver a privado en cualquier momento.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Convertirse en Supporter</h2>
        <p>
          El desglose comunitario detallado — gráficos de tendencias, desgloses regionales, los colmenares
          de mejor rendimiento — está desbloqueado para los Supporters de HivePulse. Convertirse en Supporter también ayuda a mantener
          la plataforma en funcionamiento y gratuita para todos los apicultores.
        </p>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>La compra integrada de Supporter llegará pronto. Mientras tanto, visite la <a href="/contribute">página Contribuir</a> para aprender cómo apoyar el proyecto.</p>
        </div>
      </section>
    </>
  );
}
