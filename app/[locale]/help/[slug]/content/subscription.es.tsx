import type HelpScreenshot from '@/components/HelpScreenshot';

export default function SubscriptionContent({ Screenshot }: { Screenshot: typeof HelpScreenshot }) {
  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">Qué es gratuito</h2>
        <p>HivePulse es gratuito hasta 10 colmenas, con todos los colmenares que quieras. Diez cubre al apicultor con unas pocas colmenas detrás de casa, a quien nunca habría que pedirle dinero.</p>
        <p>Por encima, una suscripción Supporter cuesta 19,99 € al año. Un año y no un mes porque la apicultura es estacional: casi todo ocurre entre marzo y octubre, y una suscripción mensual invitaría a cancelar cada otoño.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Qué no hace nunca alcanzar el límite</h2>
        <p><strong>Alcanzar un límite nunca cierra lo que ya existe.</strong></p>
        <p>Nada se oculta, nada pasa a solo lectura, nada se borra. Lo único que se detiene es añadir la undécima colmena. Si te suscribes, creces hasta quince colmenas y luego dejas de pagar, conservas las quince, puedes seguir revisándolas y conservas todo tu historial: sencillamente no puedes añadir una decimosexta hasta que la suscripción vuelva a estar activa.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Qué incluye la suscripción</h2>
        <ul className="help-list">
          <li>Tantas colmenas como tengas.</li>
          <li>Invitar a alguien a trabajar contigo en un colmenar o en una sola colmena. La suscripción la necesita quien invita; el invitado que acepta, no.</li>
          <li>Tus propios campos en colmenas y revisiones. Los campos de un colmenar siguen la suscripción de su propietario, para que todas las personas invitadas puedan usarlos.</li>
          <li>Todo el historial de estadísticas en lugar del último año, y el mapa sanitario regional en Miembros.</li>
        </ul>
        <p>Gratis en cualquier caso, y así debe seguir: el rastreador de avispa asiática, el año apícola, los códigos QR y el escaneo, las revisiones registradas sin cobertura y la exportación de tus propios datos. Las estadísticas se reducen, no se niegan: una cuenta gratuita que pide todo el historial recibe un año, no un mensaje de error.</p>
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Suscribirse</h2>
        <ol className="help-steps">
          <li>
            <span className="help-step-num">1</span>
            <div className="help-step-body">En la web, abre <strong>Panel → Suscripción</strong>. La página muestra cuántas colmenas tienes, qué incluye la suscripción y si ya hay algo activo.</div>
          </li>
          <li>
            <span className="help-step-num">2</span>
            <div className="help-step-body">Elige <strong>Suscribirse</strong> y completa el pago. Todo se desbloquea en cuanto se confirma — en la web y en ambas aplicaciones, porque la suscripción pertenece a la cuenta y no al dispositivo.</div>
          </li>
        </ol>
        <p>De momento la suscripción se compra en la web. En las apps de iPhone y Android la compra pasará por la App Store y Google Play, como exigen esas tiendas, y eso todavía se está construyendo. Compres por donde compres, la suscripción pertenece a tu cuenta de HivePulse y vale en todas partes donde inicies sesión; el límite en sí ya se aplica en las tres.</p>
        <Screenshot src="/docs/screenshots/subscription.png" caption="La página de Suscripción: lo que tienes, qué incluye la suscripción y dónde cancelar" />
      </section>

      <section className="help-section">
        <h2 className="help-section-title">Cancelar y qué ocurre después</h2>
        <p>Una suscripción comprada en la App Store o en Google Play solo puede cancelarse allí: en el iPhone, en Ajustes bajo tu nombre; en Google Play, en Pagos y suscripciones. Ni la app ni la web pueden cancelarla, y la página de Suscripción lo dice y te indica el sitio correcto. Una suscripción comprada en la web se cancela con el enlace de esa misma página.</p>
        <p>Cancelar no la termina de inmediato: sigue hasta el final del periodo pagado, y la página de Suscripción muestra esa fecha. Después vuelve a aplicarse el límite gratuito y, como arriba, todo lo que hayas registrado se queda exactamente donde está.</p>
      </section>
    </>
  );
}
