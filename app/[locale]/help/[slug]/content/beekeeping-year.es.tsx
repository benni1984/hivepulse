import type HelpScreenshot from '@/components/HelpScreenshot';

export default function BeekeepingYearContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Lo que muestra la línea del tiempo</h2>
        <p>
          El año apícola es una línea del tiempo de lo que hace un apicultor y cuándo, mes a mes: alimentar con candy
          en febrero, las primeras revisiones, el control de la enjambrazón cada semana y como máximo cada 9 días, los
          cuadros de zánganos contra la varroa, cuándo trasladar para qué miel y cuándo extraerla, y la preparación del
          invierno con el tratamiento contra la varroa y la alimentación.
        </p>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Es interminable: desplázate hacia arriba y hacia abajo, el año se repite.</li>
          <li>Se abre en hoy. Lo que está en curso lleva la marca <em>Ahora</em>, y una línea muestra dónde cae hoy.</li>
          <li>Una tarea que se repite dice cada cuánto, por ejemplo <em>Como máximo cada 9 días</em> en el control de la enjambrazón.</li>
          <li>Una tarea sobre una miel la indica, por ejemplo colza o acacia.</li>
        </ul>
        <p>
          La encuentras en el menú del panel de la web (<em>Año apícola</em>) y en la barra de la lista de colmenares de
          ambas apps (el icono de calendario).
        </p>
        <Screenshot android="/docs/screenshots/android-beekeeping-year.png" web="/docs/screenshots/beekeeping-year.png" caption="El año apícola, abierto en hoy" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Indicar tu región</h2>
        <p>
          Las fechas están escritas para el centro de Alemania. La naturaleza va antes en el sur y más tarde en el norte;
          por eso le dices a HivePulse dónde tienes tus abejas y las fechas se desplazan: unos cuatro días por grado de
          latitud, así que una colonia cerca de Hamburgo florece unas dos semanas más tarde que una cerca de Fráncfort.
        </p>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">
              <strong>Abrir la región</strong>
              <p>En la web: <em>Perfil</em>, tarjeta <em>Región para el año apícola</em>. En las apps: <em>Ajustes &rarr; Región</em>, o <em>Indicar la región</em> en la línea del tiempo.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">
              <strong>Elegir el país y escribir el código postal</strong>
              <p>HivePulse busca el código postal una vez y solo guarda la posición, no la dirección.</p>
            </div>
          </li>
          <li>
            <span className="help-step-num">3</span>
            <div className="help-step-body">
              <strong>Ajustar a mano si quieres</strong>
              <p>Un valle de montaña es más tardío, un jardín resguardado más temprano. Suma o resta hasta 28 días.</p>
            </div>
          </li>
        </ol>
        <div className="help-callout info">
          <i className="fas fa-info-circle" />
          <p>
            Sin región, la línea del tiempo usa la posición de tu primer colmenar, y sin ella las fechas del centro de
            Alemania. Una línea sobre la línea del tiempo dice cuál, y cuántos días desplaza las fechas.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Miel: cuándo trasladar, cuándo extraer</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li><strong>Colza:</strong> trasladar al comienzo de la floración, extraer enseguida al terminar (se solidifica en pocos días).</li>
          <li><strong>Acacia:</strong> una floración de unos diez días, así que trasladar justo entonces; la miel permanece líquida mucho tiempo.</li>
          <li><strong>Tilo:</strong> desde finales de junio; extraer cuando dos tercios estén operculados y el agua sea del 18 % o menos.</li>
          <li><strong>Abeto y picea (mielada):</strong> trasladar solo cuando el flujo esté confirmado; extraer templada y a tiempo, antes de que cristalice en el panal.</li>
          <li><strong>Castaño, lavanda, girasol:</strong> en el sur y en veranos cálidos; el girasol cristaliza muy rápido.</li>
          <li><strong>Brezo:</strong> desde agosto; la miel es gelatinosa y se prensa, no se extrae.</li>
        </ul>
        <p>
          Una miel está madura cuando los panales están operculados a unos dos tercios (prueba de sacudida: no salta
          nada) y el contenido de agua es del 18 % o menos, medido con un refractómetro.
        </p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Conviene saber</h2>
        <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '.9rem' }}>
          <li>Las fechas son valores orientativos de la práctica apícola habitual, no normas: la floración y el tiempo deciden.</li>
          <li>Medicamentos solo según la autorización y las normas de tu país; en caso de duda, pregunta a tu asociación de apicultores o a la autoridad veterinaria.</li>
          <li>La sospecha de loque debe comunicarse a la autoridad veterinaria.</li>
          <li>Los textos están en el idioma de la app: inglés, alemán, francés y español.</li>
        </ul>
      </section>
    </>
  );
}
