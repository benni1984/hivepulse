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
  {
    id: 'qr-codes',
    title: t(
      'QR stickers, and what they are for',
      'QR-Aufkleber, und wofür sie gut sind',
      'Les autocollants QR, et à quoi ils servent',
      'Las pegatinas QR, y para qué sirven',
      'Naklejki QR i do czego służą',
    ),
    summary: t(
      'A sheet of stickers, printed once, and a colony is one scan away for the rest of its life.',
      'Ein Blatt Aufkleber, einmal gedruckt, und ein Volk ist für den Rest seines Lebens einen Scan entfernt.',
      'Une planche d’autocollants, imprimée une fois, et une ruche est à un scan de distance pour le reste de sa vie.',
      'Una hoja de pegatinas, impresa una vez, y una colmena queda a un escaneo de distancia el resto de su vida.',
      'Arkusz naklejek, wydrukowany raz, i rodzina jest na jedno skanowanie przez resztę swojego życia.',
    ),
    steps: [
      {
        anchor: 'qr-new-batch',
        path: '/dashboard/qr-batches',
        advance: 'click',
        text: t(
          'A batch is a sheet of stickers. Make one before you print anything — the codes have to exist before they can mean a colony.',
          'Ein QR-Batch ist ein Blatt Aufkleber. Lege eines an, bevor du etwas druckst — die Codes müssen existieren, bevor sie ein Volk bedeuten können.',
          'Un lot est une planche d’autocollants. Créez-en un avant d’imprimer quoi que ce soit — les codes doivent exister avant de pouvoir désigner une ruche.',
          'Un lote es una hoja de pegatinas. Crea uno antes de imprimir nada — los códigos tienen que existir antes de poder significar una colmena.',
          'Partia to arkusz naklejek. Utwórz ją, zanim cokolwiek wydrukujesz — kody muszą istnieć, zanim będą mogły oznaczać rodzinę.',
        ),
      },
      {
        anchor: 'qr-batch-count',
        advance: 'manual',
        text: t(
          'How many stickers. Take more than you have colonies: a spare sheet in the shed costs nothing, and a sticker nobody has scanned yet belongs to no colony.',
          'Wie viele Aufkleber. Nimm mehr, als du Völker hast: ein Reserveblatt im Schuppen kostet nichts, und ein Aufkleber, den noch niemand gescannt hat, gehört zu keinem Volk.',
          'Combien d’autocollants. Prenez-en plus que vous n’avez de ruches : une planche de réserve dans la cabane ne coûte rien, et un autocollant que personne n’a scanné n’appartient à aucune ruche.',
          'Cuántas pegatinas. Coge más de las colmenas que tienes: una hoja de reserva en la caseta no cuesta nada, y una pegatina que nadie ha escaneado no pertenece a ninguna colmena.',
          'Ile naklejek. Weź więcej, niż masz rodzin: zapasowy arkusz w szopie nic nie kosztuje, a naklejka, której nikt jeszcze nie zeskanował, nie należy do żadnej rodziny.',
        ),
      },
      {
        anchor: 'qr-batch-create',
        advance: 'click',
        text: t(
          'Generate them.',
          'Erzeuge sie.',
          'Générez-les.',
          'Genéralas.',
          'Wygeneruj je.',
        ),
      },
      {
        anchor: 'qr-batch-open',
        advance: 'click',
        text: t(
          'Open the batch.',
          'Öffne das Batch.',
          'Ouvrez le lot.',
          'Abre el lote.',
          'Otwórz partię.',
        ),
      },
      {
        anchor: 'qr-batch-pdf',
        advance: 'manual',
        text: t(
          'This is the sheet to print, on paper that survives a winter. Stick one on a hive, scan it with the app, and from then on that sticker opens that colony — no list, no searching, one hand free.',
          'Das ist das Blatt zum Drucken, auf Papier, das einen Winter übersteht. Klebe einen auf eine Beute, scanne ihn mit der App, und von da an öffnet dieser Aufkleber dieses Volk — keine Liste, kein Suchen, eine Hand frei.',
          'Voici la planche à imprimer, sur un papier qui passe l’hiver. Collez-en un sur une ruche, scannez-le avec l’application, et dès lors cet autocollant ouvre cette ruche — pas de liste, pas de recherche, une main libre.',
          'Esta es la hoja para imprimir, en papel que aguante un invierno. Pega una en una colmena, escanéala con la app, y desde entonces esa pegatina abre esa colmena — sin lista, sin buscar, con una mano libre.',
          'To arkusz do druku, na papierze, który przetrwa zimę. Naklej jedną na ul, zeskanuj ją aplikacją, i od tej pory ta naklejka otwiera tę rodzinę — bez listy, bez szukania, z jedną wolną ręką.',
        ),
      },
    ],
  },
  {
    id: 'hornets',
    title: t(
      'A trap, and what you do with it daily',
      'Eine Falle, und was man täglich mit ihr macht',
      'Un piège, et ce qu’on en fait chaque jour',
      'Una trampa, y qué se hace con ella a diario',
      'Pułapka i co się z nią robi codziennie',
    ),
    summary: t(
      'Register a named trap, then log what it caught. One number a day is the whole job.',
      'Eine benannte Falle anmelden, dann festhalten, was sie gefangen hat. Eine Zahl am Tag ist die ganze Arbeit.',
      'Enregistrer un piège nommé, puis noter ce qu’il a pris. Un chiffre par jour, c’est tout le travail.',
      'Registrar una trampa con nombre y luego apuntar lo que ha capturado. Un número al día es todo el trabajo.',
      'Zarejestrować nazwaną pułapkę, a potem zapisywać, co złowiła. Jedna liczba dziennie to cała praca.',
    ),
    steps: [
      {
        anchor: 'trap-new',
        path: '/hornets/traps',
        advance: 'click',
        text: t(
          'A trap here is a physical trap of yours, in one place, with a name. Register it once.',
          'Eine Falle ist hier eine echte Falle von dir, an einem Ort, mit einem Namen. Melde sie einmal an.',
          'Un piège ici est un piège réel qui vous appartient, à un endroit, avec un nom. Enregistrez-le une fois.',
          'Una trampa aquí es una trampa física tuya, en un sitio, con un nombre. Regístrala una vez.',
          'Pułapka to tutaj Twoja prawdziwa pułapka, w jednym miejscu, z nazwą. Zarejestruj ją raz.',
        ),
      },
      {
        anchor: 'trap-name',
        advance: 'manual',
        text: t(
          'A name you can tell apart in the dark — “behind the shed”, not “trap 2”. The position matters more than the name: the map is only as useful as the coordinates on it.',
          'Ein Name, den du im Dunkeln unterscheiden kannst — „hinter dem Schuppen“, nicht „Falle 2“. Der Standort ist wichtiger als der Name: die Karte ist nur so nützlich wie die Koordinaten auf ihr.',
          'Un nom que vous distinguez dans le noir — « derrière la cabane », pas « piège 2 ». La position compte plus que le nom : la carte ne vaut que ce que valent ses coordonnées.',
          'Un nombre que distingas en la oscuridad — «detrás de la caseta», no «trampa 2». La posición importa más que el nombre: el mapa solo vale lo que valen sus coordenadas.',
          'Nazwa, którą rozpoznasz po ciemku — „za szopą”, nie „pułapka 2”. Położenie liczy się bardziej niż nazwa: mapa jest warta tyle, ile współrzędne na niej.',
        ),
      },
      {
        anchor: 'trap-register',
        advance: 'click',
        text: t(
          'Register it. You get an eight-character code with it — that is how you reach this trap again from another device, without an account.',
          'Melde sie an. Du bekommst dazu einen achtstelligen Code — damit erreichst du diese Falle von einem anderen Gerät wieder, ohne Konto.',
          'Enregistrez-le. Vous recevez un code de huit caractères — c’est ainsi que vous retrouvez ce piège depuis un autre appareil, sans compte.',
          'Regístrala. Recibes un código de ocho caracteres — así vuelves a esta trampa desde otro dispositivo, sin cuenta.',
          'Zarejestruj ją. Dostajesz do niej ośmioznakowy kod — tak wracasz do tej pułapki z innego urządzenia, bez konta.',
        ),
      },
      {
        anchor: 'trap-catch',
        advance: 'manual',
        text: t(
          'And this is the daily job: how many Asian hornets were in it. One entry per trap per day — enter it twice and the second number replaces the first, so a correction is not a second day. European hornets do not belong in a trap and do not belong in this number.',
          'Und das ist die tägliche Arbeit: wie viele Asiatische Hornissen darin waren. Ein Eintrag pro Falle und Tag — gibst du zweimal ein, ersetzt die zweite Zahl die erste, eine Korrektur ist also kein zweiter Tag. Europäische Hornissen gehören nicht in eine Falle und nicht in diese Zahl.',
          'Et voilà le travail quotidien : combien de frelons asiatiques s’y trouvaient. Une saisie par piège et par jour — saisissez deux fois et le second chiffre remplace le premier, une correction n’est donc pas un second jour. Le frelon européen n’a rien à faire dans un piège, ni dans ce chiffre.',
          'Y este es el trabajo diario: cuántas avispas asiáticas había dentro. Una entrada por trampa y día — si introduces dos veces, el segundo número sustituye al primero, así que una corrección no es un segundo día. El avispón europeo no debe estar en una trampa ni en este número.',
          'A to codzienna praca: ile szerszeni azjatyckich w niej było. Jeden wpis na pułapkę na dzień — wpisz dwa razy i druga liczba zastąpi pierwszą, więc poprawka to nie drugi dzień. Szerszeń europejski nie należy do pułapki ani do tej liczby.',
        ),
      },
    ],
  },
  {
    id: 'year',
    title: t(
      'The beekeeping year, shifted to your region',
      'Das Bienenjahr, auf deine Region verschoben',
      'L’année apicole, décalée vers votre région',
      'El año apícola, desplazado a tu región',
      'Rok pasieczny, przesunięty na Twój region',
    ),
    summary: t(
      'What happens when, and why the dates are not the same on a hill as in a valley.',
      'Was wann passiert, und warum die Daten am Hang nicht die gleichen sind wie im Tal.',
      'Ce qui se passe quand, et pourquoi les dates ne sont pas les mêmes sur un coteau et dans une vallée.',
      'Qué pasa cuándo, y por qué las fechas no son las mismas en una ladera que en un valle.',
      'Co kiedy się dzieje i dlaczego daty na zboczu nie są takie same jak w dolinie.',
    ),
    steps: [
      {
        anchor: 'year-ribbon',
        path: '/dashboard/calendar',
        advance: 'click',
        text: t(
          'The same year as a band instead of a list. Which jobs overlap is a thing you see and cannot read.',
          'Dasselbe Jahr als Band statt als Liste. Welche Arbeiten sich überlappen, sieht man — lesen kann man es nicht.',
          'La même année en bande plutôt qu’en liste. Quels travaux se chevauchent, cela se voit et ne se lit pas.',
          'El mismo año como banda en vez de lista. Qué trabajos se solapan se ve, no se lee.',
          'Ten sam rok jako wstęga, a nie lista. Które prace się nakładają, widzi się, a nie czyta.',
        ),
      },
      {
        anchor: 'year-rate',
        advance: 'click',
        text: t(
          'And the dates move. A season that came three weeks early is not an error in the calendar, it is this year — so the calendar asks, here, and shifts the regional dates once enough beekeepers in one place have said the same thing.',
          'Und die Daten wandern. Eine Saison, die drei Wochen früher kam, ist kein Fehler im Kalender, sondern dieses Jahr — deshalb fragt der Kalender, hier, und verschiebt die regionalen Daten, sobald genug Imker an einem Ort dasselbe gesagt haben.',
          'Et les dates bougent. Une saison arrivée trois semaines plus tôt n’est pas une erreur du calendrier, c’est cette année — alors le calendrier demande, ici, et décale les dates régionales dès que suffisamment d’apiculteurs d’un même endroit ont dit la même chose.',
          'Y las fechas se mueven. Una temporada que llegó tres semanas antes no es un error del calendario, es este año — así que el calendario pregunta, aquí, y desplaza las fechas regionales cuando suficientes apicultores de un mismo sitio han dicho lo mismo.',
          'A daty się przesuwają. Sezon, który przyszedł trzy tygodnie wcześniej, nie jest błędem kalendarza, lecz tym rokiem — dlatego kalendarz pyta, tutaj, i przesuwa regionalne daty, gdy dość pszczelarzy w jednym miejscu powie to samo.',
        ),
      },
    ],
  },
  {
    id: 'treatments',
    title: t(
      'Treatments you will not have to remember',
      'Behandlungen, die du nicht erinnern musst',
      'Des traitements que vous n’aurez pas à retenir',
      'Tratamientos que no tendrás que recordar',
      'Zabiegi, których nie musisz pamiętać',
    ),
    summary: t(
      'Plan one with a due date, tick it off when it is done, and the record writes itself.',
      'Eine mit Fälligkeitsdatum planen, abhaken, wenn sie erledigt ist — die Dokumentation schreibt sich selbst.',
      'En planifier un avec une échéance, le cocher quand c’est fait, et la traçabilité s’écrit d’elle-même.',
      'Planificar uno con fecha, marcarlo cuando esté hecho, y el registro se escribe solo.',
      'Zaplanować jeden z terminem, odhaczyć, gdy wykonany — dokumentacja pisze się sama.',
    ),
    steps: [
      {
        anchor: 'treatment-plan',
        advance: 'click',
        text: t(
          'Plan a treatment: what, and by when. It belongs to the whole apiary, because that is how varroa treatment is actually done — not one colony at a time.',
          'Plane eine Behandlung: was, und bis wann. Sie gehört zum ganzen Bienenstand, denn so wird gegen Varroa tatsächlich behandelt — nicht Volk für Volk.',
          'Planifiez un traitement : quoi, et pour quand. Il appartient au rucher entier, car c’est ainsi qu’on traite réellement contre varroa — pas ruche par ruche.',
          'Planifica un tratamiento: qué, y para cuándo. Pertenece al colmenar entero, porque así se trata de verdad contra varroa — no colmena por colmena.',
          'Zaplanuj zabieg: co i na kiedy. Należy do całej pasieki, bo tak naprawdę leczy się warrozę — nie rodzina po rodzinie.',
        ),
      },
      {
        anchor: 'treatment-save',
        advance: 'click',
        text: t(
          'Save it. It will sit here until you mark it done, and once it is done it stays — a treatment nobody can prove is a treatment that did not happen.',
          'Speichern. Sie steht hier, bis du sie als erledigt markierst, und danach bleibt sie stehen — eine Behandlung, die niemand nachweisen kann, ist eine Behandlung, die nicht stattgefunden hat.',
          'Enregistrez-le. Il reste ici jusqu’à ce que vous le marquiez fait, et ensuite il reste — un traitement que personne ne peut prouver est un traitement qui n’a pas eu lieu.',
          'Guárdalo. Se queda aquí hasta que lo marques como hecho, y después permanece — un tratamiento que nadie puede demostrar es un tratamiento que no ocurrió.',
          'Zapisz. Zostanie tutaj, dopóki nie oznaczysz go jako wykonany, a potem zostaje — zabieg, którego nikt nie potrafi udowodnić, to zabieg, który się nie odbył.',
        ),
      },
    ],
  },
  {
    id: 'sharing',
    title: t(
      'Letting somebody else see the apiary',
      'Jemand anderen auf den Bienenstand lassen',
      'Laisser quelqu’un d’autre voir le rucher',
      'Dejar que otro vea el colmenar',
      'Wpuścić kogoś innego do pasieki',
    ),
    summary: t(
      'An invitation by email, and what the other person may then do.',
      'Eine Einladung per E-Mail — und was der andere dann darf.',
      'Une invitation par courriel, et ce que l’autre peut alors faire.',
      'Una invitación por correo, y qué puede hacer la otra persona.',
      'Zaproszenie e-mailem i co ta druga osoba może potem zrobić.',
    ),
    steps: [
      {
        anchor: 'sharing-email',
        advance: 'manual',
        text: t(
          'The email address of the person you are keeping bees with. They need an account of their own; nothing is sent to somebody who has not got one.',
          'Die E-Mail-Adresse der Person, mit der du imkerst. Sie braucht ein eigenes Konto; an jemanden ohne Konto wird nichts geschickt.',
          'L’adresse de la personne avec qui vous tenez les ruches. Il lui faut son propre compte ; rien n’est envoyé à quelqu’un qui n’en a pas.',
          'El correo de la persona con quien llevas las abejas. Necesita su propia cuenta; a quien no la tiene no se le envía nada.',
          'Adres osoby, z którą prowadzisz pasiekę. Potrzebuje własnego konta; do kogoś bez konta nic nie zostanie wysłane.',
        ),
      },
      {
        anchor: 'sharing-invite',
        advance: 'click',
        text: t(
          'Invite them. They see this apiary and record inspections in it; they cannot delete it, and you can take the access back here at any time.',
          'Lade sie ein. Sie sieht diesen Bienenstand und hält darin Kontrollen fest; löschen kann sie ihn nicht, und du kannst den Zugang hier jederzeit zurücknehmen.',
          'Invitez-la. Elle voit ce rucher et y enregistre des visites ; elle ne peut pas le supprimer, et vous pouvez reprendre l’accès ici à tout moment.',
          'Invítala. Ve este colmenar y registra revisiones en él; no puede borrarlo, y puedes retirar el acceso aquí en cualquier momento.',
          'Zaproś ją. Widzi tę pasiekę i zapisuje w niej przeglądy; nie może jej usunąć, a Ty możesz tu odebrać dostęp w każdej chwili.',
        ),
      },
    ],
  },
  {
    id: 'custom-fields',
    title: t(
      'Writing down what this app did not think of',
      'Aufschreiben, woran diese App nicht gedacht hat',
      'Noter ce que cette application n’a pas prévu',
      'Apuntar lo que esta app no previó',
      'Zapisać to, o czym ta aplikacja nie pomyślała',
    ),
    summary: t(
      'Your own field on every inspection, in the shape you need it.',
      'Ein eigenes Feld in jeder Kontrolle, in der Form, in der du es brauchst.',
      'Votre propre champ sur chaque visite, dans la forme dont vous avez besoin.',
      'Tu propio campo en cada revisión, con la forma que necesitas.',
      'Twoje własne pole w każdym przeglądzie, w potrzebnej Ci postaci.',
    ),
    steps: [
      {
        anchor: 'field-new',
        path: '/dashboard/field-definitions',
        advance: 'click',
        text: t(
          'Nobody can guess what you record. Mead batch, feed given, the queen’s temper — make the field yourself.',
          'Niemand kann erraten, was du erfasst. Met-Ansatz, Futtergabe, das Temperament der Königin — lege das Feld selbst an.',
          'Personne ne peut devenir ce que vous notez. Cuvée d’hydromel, nourrissement, caractère de la reine — créez le champ vous-même.',
          'Nadie puede adivinar qué apuntas tú. Partida de hidromiel, alimentación, el carácter de la reina — crea el campo tú mismo.',
          'Nikt nie odgadnie, co zapisujesz. Partia miodu pitnego, podkarmianie, charakter matki — utwórz pole samodzielnie.',
        ),
      },
      {
        anchor: 'field-type',
        advance: 'manual',
        text: t(
          'The type decides what the form gives you in the field: a number gets a stepper you can hit with a glove on, a selection gets buttons, free text gets a keyboard — which is the one to avoid when it is raining.',
          'Der Typ entscheidet, was das Formular dir draußen gibt: eine Zahl bekommt einen Schrittzähler, den du mit Handschuh treffen kannst, eine Auswahl bekommt Knöpfe, freier Text bekommt eine Tastatur — und die ist die, die man im Regen meidet.',
          'Le type décide de ce que le formulaire vous donne sur le terrain : un nombre reçoit un compteur qu’on atteint avec un gant, une sélection reçoit des boutons, le texte libre reçoit un clavier — celui qu’on évite sous la pluie.',
          'El tipo decide qué te da el formulario en el campo: un número recibe un contador que aciertas con guante, una selección recibe botones, el texto libre recibe un teclado — el que conviene evitar bajo la lluvia.',
          'Typ decyduje, co formularz da Ci w polu: liczba dostaje licznik, który trafisz w rękawicy, wybór dostaje przyciski, wolny tekst dostaje klawiaturę — tę, której unika się w deszczu.',
        ),
      },
    ],
  },
  {
    id: 'moves',
    title: t(
      'Moving colonies, and why it is worth recording',
      'Völker wandern, und warum das festgehalten gehört',
      'Transhumer des ruches, et pourquoi cela se note',
      'Trashumancia, y por qué conviene registrarla',
      'Wędrówka rodzin i dlaczego warto to zapisać',
    ),
    summary: t(
      'Move several colonies to another apiary at once, and keep where they have been.',
      'Mehrere Völker auf einmal auf einen anderen Bienenstand bringen — und behalten, wo sie gewesen sind.',
      'Déplacer plusieurs ruches vers un autre rucher d’un coup, et garder où elles ont été.',
      'Llevar varias colmenas a otro colmenar de una vez, y conservar dónde han estado.',
      'Przenieść kilka rodzin do innej pasieki naraz i zachować, gdzie były.',
    ),
    steps: [
      {
        anchor: 'move-hives',
        advance: 'click',
        text: t(
          'Colonies travel — to the rape, to the heather, to a hive stand that stopped being the right one. Move them here rather than editing each colony in turn.',
          'Völker wandern — in den Raps, in die Heide, von einem Standplatz weg, der keiner mehr ist. Bring sie hier um, statt jedes Volk einzeln zu bearbeiten.',
          'Les ruches voyagent — au colza, à la bruyère, loin d’un emplacement qui n’en est plus un. Déplacez-les ici plutôt que de modifier chaque ruche l’une après l’autre.',
          'Las colmenas viajan — a la colza, al brezo, lejos de un asentamiento que ya no lo es. Muévelas aquí en vez de editar cada colmena una por una.',
          'Rodziny podróżują — na rzepak, na wrzos, z miejsca, które przestało nim być. Przenieś je tutaj, zamiast edytować każdą rodzinę po kolei.',
        ),
      },
      {
        anchor: 'move-submit',
        advance: 'click',
        text: t(
          'Move them. Where a colony stood and when is kept, so a year later you can still tell whether that heather trip was worth it — and the moves map draws the lines.',
          'Bringe sie um. Wo ein Volk stand und wann, bleibt erhalten — damit du ein Jahr später noch weißt, ob die Heidewanderung etwas gebracht hat, und die Wanderkarte die Linien zeichnet.',
          'Déplacez-les. Où une ruche se trouvait et quand est conservé, pour qu’un an plus tard vous sachiez encore si la transhumance à la bruyère valait la peine — et la carte en trace les lignes.',
          'Muévelas. Dónde estuvo una colmena y cuándo se conserva, para que un año después sigas sabiendo si aquel viaje al brezo valió la pena — y el mapa de traslados dibuja las líneas.',
          'Przenieś je. Gdzie rodzina stała i kiedy, zostaje zachowane, byś rok później wciąż wiedział, czy wyjazd na wrzos się opłacił — a mapa wędrówek rysuje linie.',
        ),
      },
    ],
  },
];

export function tourById(id: string): Tour | undefined {
  return TOURS.find(tour => tour.id === id);
}
