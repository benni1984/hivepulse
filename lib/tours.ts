import { type Localized, pick } from '@/lib/releaseNotes';

export { pick };

/**
 * The guided tours, as data.
 *
 * The tour we had was a carousel of six screens shown once after the first sign-in, describing
 * features in the voice of a product page and then disappearing. Afterwards the beekeeper stood
 * on a screen that said "No apiaries yet" and nothing had been pointed at — and on the website
 * there was no tour at all (#449).
 *
 * This one points at the real control, on the real screen, and waits for the real click.
 *
 * `anchor` is a `data-tour` attribute on an actual element. That is the whole coupling between a
 * tour and the interface, and the first thing that will rot: rename a component, move a button,
 * and a step points at nothing. `__tests__/Tours.test.ts` pins every anchor against the source,
 * and the engine refuses to show a dark screen with nothing lit — it says it cannot find the
 * control and offers to leave.
 */
export type Advance =
  /** The step ends when the user clicks that control. The default, and the point of the thing. */
  | 'click'
  /** The step ends when the app navigates — for a control that opens another page. */
  | 'route'
  /**
   * A small "next" for a step that only explains something and has nothing to click. Used
   * sparingly: a tour made of these is the carousel again.
   */
  | 'manual';

export interface TourStep {
  /** The `data-tour` value of the element to point at. */
  anchor: string;
  text: Localized;
  advance?: Advance;
  /**
   * Where this step lives, for the engine to say "go to the apiary list first" rather than
   * hunting for an anchor that cannot be on this page. A path, `*` matching any tail.
   */
  path?: string;
}

export interface Tour {
  id: string;
  title: Localized;
  /** Shown in the list of tours, so somebody can tell what they are about to be shown. */
  summary: Localized;
  steps: TourStep[];
}

function t(en: string, de: string, fr: string, es: string, pl: string): Localized {
  return { en, de, fr, es, pl };
}

export const TOURS: Tour[] = [
  {
    id: 'first-steps',
    title: t(
      'Your first colony',
      'Dein erstes Volk',
      'Votre première colonie',
      'Tu primera colonia',
      'Twoja pierwsza rodzina',
    ),
    summary: t(
      'From an empty account to a recorded inspection.',
      'Von einem leeren Konto zur ersten festgehaltenen Kontrolle.',
      'D’un compte vide à une première visite enregistrée.',
      'De una cuenta vacía a una primera revisión registrada.',
      'Od pustego konta do pierwszego zapisanego przeglądu.',
    ),
    steps: [
      {
        anchor: 'new-apiary',
        path: '/dashboard',
        advance: 'click',
        text: t(
          'An apiary is a place where your colonies stand — a garden, an orchard, a spot on a hill. Start with one.',
          'Ein Bienenstand ist ein Ort, an dem deine Völker stehen — ein Garten, eine Streuobstwiese, eine Stelle am Hang. Fang mit einem an.',
          'Un rucher est un endroit où se trouvent vos colonies — un jardin, un verger, un coin de coteau. Commencez par un.',
          'Un colmenar es un lugar donde están tus colonias — un jardín, un frutal, un rincón en la ladera. Empieza por uno.',
          'Pasieka to miejsce, w którym stoją twoje rodziny — ogród, sad, zbocze. Zacznij od jednej.',
        ),
      },
      {
        anchor: 'apiary-name',
        advance: 'manual',
        text: t(
          'Give it the name you would use out loud. You will be reading it in the rain.',
          'Gib ihm den Namen, den du laut benutzen würdest. Du wirst ihn im Regen lesen.',
          'Donnez-lui le nom que vous emploieriez à voix haute. Vous le lirez sous la pluie.',
          'Dale el nombre que usarías en voz alta. Lo leerás bajo la lluvia.',
          'Nadaj jej nazwę, której użyjesz na głos. Będziesz ją czytać w deszczu.',
        ),
      },
      {
        anchor: 'apiary-save',
        advance: 'click',
        text: t(
          'Save it. Everything else hangs off an apiary.',
          'Speichern. Alles Weitere hängt an einem Bienenstand.',
          'Enregistrez. Tout le reste dépend d’un rucher.',
          'Guárdalo. Todo lo demás depende de un colmenar.',
          'Zapisz. Wszystko inne wisi na pasiece.',
        ),
      },
      {
        anchor: 'apiary-open',
        advance: 'click',
        text: t(
          'Open it. The colonies live inside an apiary.',
          'Öffne ihn. Die Völker liegen innerhalb eines Bienenstandes.',
          'Ouvrez-le. Les colonies vivent dans un rucher.',
          'Ábrelo. Las colonias viven dentro de un colmenar.',
          'Otwórz ją. Rodziny mieszkają wewnątrz pasieki.',
        ),
      },
      {
        anchor: 'new-hive',
        advance: 'click',
        text: t(
          'Add a colony. You do not need a printed QR code for this — the sticker is a shortcut to a colony that already exists, not a requirement for making one.',
          'Lege ein Volk an. Dafür brauchst du keinen gedruckten QR-Code — der Aufkleber ist eine Abkürzung zu einem Volk, das es schon gibt, keine Voraussetzung dafür.',
          'Ajoutez une colonie. Pas besoin de QR code imprimé pour cela — l’autocollant est un raccourci vers une colonie existante, pas une condition pour en créer une.',
          'Añade una colonia. No necesitas un código QR impreso para esto — la pegatina es un atajo a una colonia que ya existe, no un requisito para crearla.',
          'Dodaj rodzinę. Nie potrzebujesz do tego wydrukowanego kodu QR — naklejka to skrót do rodziny, która już istnieje, a nie warunek jej utworzenia.',
        ),
      },
    ],
  },
  {
    id: 'offline',
    title: t(
      'It works without a signal',
      'Es funktioniert ohne Netz',
      'Ça marche sans réseau',
      'Funciona sin cobertura',
      'Działa bez zasięgu',
    ),
    summary: t(
      'The one thing you cannot find out by looking, and the one that matters at the apiary.',
      'Das Einzige, was man durch Hinsehen nicht herausfindet — und das, worauf es am Bienenstand ankommt.',
      'La seule chose qu’on ne découvre pas en regardant, et celle qui compte au rucher.',
      'Lo único que no se descubre mirando, y lo que importa en el colmenar.',
      'Jedyna rzecz, której nie da się odkryć patrząc, i ta, która liczy się w pasiece.',
    ),
    steps: [
      {
        anchor: 'new-inspection',
        advance: 'manual',
        text: t(
          'In the apps, an inspection recorded with no signal is stored on the phone and sent when there is one. You will see "Waiting to upload" in the list until it has gone. Nothing is lost if you walk out of range mid-visit.',
          'In den Apps wird eine ohne Netz erfasste Kontrolle auf dem Telefon gespeichert und gesendet, sobald es wieder Netz gibt. In der Liste steht bis dahin „Wartet auf Upload". Es geht nichts verloren, wenn du mitten im Besuch aus dem Funkloch läufst.',
          'Dans les applications, une visite enregistrée sans réseau est stockée sur le téléphone et envoyée dès qu’il y en a. La liste affiche « En attente d’envoi » jusque-là. Rien n’est perdu si vous sortez de portée en pleine visite.',
          'En las apps, una revisión registrada sin cobertura se guarda en el teléfono y se envía cuando la haya. La lista muestra «Esperando subida» hasta entonces. No se pierde nada si te quedas sin cobertura a mitad de la visita.',
          'W aplikacjach przegląd zapisany bez zasięgu zostaje w telefonie i zostaje wysłany, gdy zasięg wróci. Na liście widnieje wtedy „Czeka na wysłanie". Nic nie przepada, jeśli w trakcie wizyty wyjdziesz z zasięgu.',
        ),
      },
    ],
  },
];

export function tourById(id: string): Tour | undefined {
  return TOURS.find(tour => tour.id === id);
}
