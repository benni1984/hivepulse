// Release notes and the full list of features. Every text carries all five site locales; the page
// (app/[locale]/release-notes/page.tsx) picks the one matching the current locale. The apps open this
// page from Settings, so what is written here is what beekeepers read on every platform.

export type ReleaseLocale = 'en' | 'de' | 'fr' | 'es' | 'pl';
export type Localized = Record<ReleaseLocale, string>;
export type ReleaseKind = 'added' | 'changed' | 'fixed';

export interface ReleaseItem {
  kind: ReleaseKind;
  text: Localized;
}

export interface Release {
  /** ISO date, YYYY-MM-DD */
  date: string;
  title: Localized;
  items: ReleaseItem[];
}

export interface FeatureGroup {
  id: string;
  title: Localized;
  items: Localized[];
}

function t(en: string, de: string, fr: string, es: string, pl: string): Localized {
  return { en, de, fr, es, pl };
}

export function pick(text: Localized, locale: string): string {
  return text[locale as ReleaseLocale] ?? text.en;
}

/** Newest first. */
export const RELEASES: Release[] = [
  {
    date: '2026-11-10',
    title: t(
      'What day it is, asked in one place',
      'Welcher Tag es ist, an einer Stelle gefragt',
      'Quel jour on est, demandé en un seul endroit',
      'Qué día es, preguntado en un solo sitio',
      'Który jest dzień, pytane w jednym miejscu',
    ),
    items: [
      {
        kind: 'fixed',
        text: t(
          'In the evening the apps and the website filed things under the wrong day. From about ten at night in central Europe, a new inspection, a hornet report and a treatment marked as done were all dated to the day before. The trap catches were the worst of it: there is one count per trap per day, so an evening entry overwrote the previous day’s number instead of recording its own. Every screen now sends the day your own phone or computer shows.',
          'Abends trugen die Apps und die Website Dinge unter dem falschen Tag ein. Ab etwa zehn Uhr abends bekamen eine neue Kontrolle, eine Hornissen-Meldung und eine als erledigt markierte Behandlung den Tag davor. Am schlimmsten waren die Fallenfänge: es gibt eine Zahl pro Falle und Tag, also überschrieb ein Eintrag am Abend die Zahl des Vortags statt seine eigene zu speichern. Jede Ansicht schickt jetzt den Tag, den dein eigenes Gerät anzeigt.',
          'Le soir, les applications et le site enregistraient les choses au mauvais jour. À partir de vingt-deux heures environ en Europe centrale, une nouvelle visite, un signalement de frelon et un traitement marqué comme fait étaient datés de la veille. Le pire était les captures de pièges : il y a un comptage par piège et par jour, donc une saisie du soir écrasait le chiffre de la veille au lieu d’enregistrer le sien. Chaque écran envoie désormais le jour qu’affiche votre propre appareil.',
          'Por la tarde, las apps y la web guardaban las cosas con el día equivocado. A partir de las diez de la noche aproximadamente en Europa central, una revisión nueva, un aviso de avispón y un tratamiento marcado como hecho llevaban la fecha del día anterior. Lo peor eran las capturas de las trampas: hay un recuento por trampa y día, así que una entrada de la tarde sobrescribía la cifra del día anterior en lugar de guardar la suya. Ahora cada pantalla envía el día que muestra tu propio dispositivo.',
          'Wieczorem aplikacje i strona zapisywały rzeczy pod niewłaściwym dniem. Od około dwudziestej drugiej w Europie środkowej nowy przegląd, zgłoszenie szerszenia i zabieg oznaczony jako wykonany dostawały datę dnia poprzedniego. Najgorzej było z odłowami z pułapek: na pułapkę i dzień przypada jedna liczba, więc wieczorny wpis nadpisywał liczbę z poprzedniego dnia zamiast zapisać własną. Każdy ekran wysyła teraz dzień, który pokazuje twoje własne urządzenie.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          'The reminder for a hive that has never been inspected could be a day out. It was worked out from two clocks at once — the day the hive was created, counted in one time zone, and today, counted in another. The one job of that date is to say when, so it now has a single answer.',
          'Die Erinnerung für ein Volk, das noch nie kontrolliert wurde, konnte einen Tag daneben liegen. Sie wurde aus zwei Uhren zugleich berechnet — der Tag, an dem das Volk angelegt wurde, in einer Zeitzone gezählt, und heute, in einer anderen. Die einzige Aufgabe dieses Datums ist zu sagen, wann — also gibt es jetzt nur noch eine Antwort.',
          'Le rappel pour une ruche jamais visitée pouvait être décalé d’un jour. Il était calculé à partir de deux horloges à la fois : le jour de création de la ruche, compté dans un fuseau, et aujourd’hui, compté dans un autre. Le seul rôle de cette date est de dire quand, elle n’a donc plus qu’une seule réponse.',
          'El recordatorio de una colmena que nunca se ha revisado podía fallar por un día. Se calculaba con dos relojes a la vez: el día en que se creó la colmena, contado en una zona horaria, y hoy, contado en otra. La única tarea de esa fecha es decir cuándo, así que ahora tiene una sola respuesta.',
          'Przypomnienie dla rodziny pszczelej, której nigdy nie przeglądano, mogło się mylić o jeden dzień. Liczono je z dwóch zegarów naraz: dnia utworzenia rodziny, liczonego w jednej strefie czasowej, i dzisiaj, liczonego w innej. Jedynym zadaniem tej daty jest powiedzieć kiedy — ma więc teraz jedną odpowiedź.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          'A phone set to a calendar other than the Gregorian one wrote that calendar’s year into the date. On a phone using the Thai Buddhist calendar, today is the year 2569, and that is what was being saved. Dates sent to the server are now always Gregorian, whatever the phone shows.',
          'Ein Telefon, das auf einen anderen als den gregorianischen Kalender eingestellt ist, schrieb dessen Jahr in das Datum. Auf einem Telefon mit thailändisch-buddhistischem Kalender ist heute das Jahr 2569 — und genau das wurde gespeichert. Daten, die zum Server gehen, sind jetzt immer gregorianisch, egal was das Telefon anzeigt.',
          'Un téléphone réglé sur un calendrier autre que grégorien inscrivait l’année de ce calendrier dans la date. Sur un téléphone utilisant le calendrier bouddhiste thaï, nous sommes en 2569, et c’est ce qui était enregistré. Les dates envoyées au serveur sont désormais toujours grégoriennes, quoi qu’affiche le téléphone.',
          'Un teléfono configurado con un calendario distinto del gregoriano escribía el año de ese calendario en la fecha. En un teléfono con el calendario budista tailandés, hoy es el año 2569, y eso es lo que se guardaba. Las fechas que van al servidor son ahora siempre gregorianas, sea lo que sea que muestre el teléfono.',
          'Telefon ustawiony na kalendarz inny niż grigoriański wpisywał w datę rok tego kalendarza. Na telefonie z tajskim kalendarzem buddyjskim dzisiaj jest rok 2569 — i to było zapisywane. Daty wysyłane na serwer są teraz zawsze grigoriańskie, niezależnie od tego, co pokazuje telefon.',
        ),
      },
    ],
  },
  {
    date: '2026-11-10',
    title: t(
      'The words the apps use, gone over one by one',
      'Die Worte der Apps, einmal durchgegangen',
      'Les mots des applications, repris un par un',
      'Las palabras de las apps, repasadas una a una',
      'Słowa aplikacji, przejrzane po kolei',
    ),
    items: [
      {
        kind: 'fixed',
        text: t(
          'Two sentences were not grammatical in the language they were written in. Spanish said “colmenas e revisiones” in nine places — the word for “and” only takes that form before an i sound — and the French reminder settings said “Rappels d’visite” twice. Both came from replacing one word and leaving the one in front of it alone.',
          'Zwei Sätze waren in ihrer eigenen Sprache nicht richtig. Spanisch sagte an neun Stellen „colmenas e revisiones“ — das Wort für „und“ lautet so nur vor einem i-Laut — und die französischen Erinnerungs-Einstellungen zweimal „Rappels d’visite“. Beides kam davon, ein Wort zu ersetzen und das davor stehen zu lassen.',
          'Deux phrases n’étaient pas correctes dans leur propre langue. L’espagnol disait « colmenas e revisiones » à neuf endroits — le mot pour « et » ne prend cette forme que devant un son i — et les réglages de rappels en français disaient deux fois « Rappels d’visite ». Dans les deux cas, un mot avait été remplacé sans toucher à celui qui le précédait.',
          'Dos frases no eran correctas en su propio idioma. En español decía «colmenas e revisiones» en nueve sitios — la «e» solo sustituye a la «y» ante sonido i — y los ajustes de recordatorios en francés decían dos veces «Rappels d’visite». En ambos casos se sustituyó una palabra y se dejó la de delante.',
          'Dwa zdania były niepoprawne we własnym języku. Hiszpański mówił „colmenas e revisiones” w dziewięciu miejscach — ta forma „i” występuje tylko przed dźwiękiem i — a francuskie ustawienia przypomnień dwukrotnie „Rappels d’visite”. Oba wzięły się z zamiany jednego słowa i pozostawienia tego przed nim.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          'The Spanish iPhone app called a hornet a wasp. The whole tab was named “Seguimiento de avispas”, and it is about one hornet species. It also called a frame of brood a picture frame. Android had all of it right, which is how it was found.',
          'Die spanische iPhone-App nannte eine Hornisse eine Wespe. Der ganze Reiter hieß „Seguimiento de avispas“, und es geht dort um eine Hornissenart. Eine Brutwabe nannte sie einen Bilderrahmen. Android hatte alles richtig — so ist es aufgefallen.',
          'L’application iPhone en espagnol appelait un frelon une guêpe. L’onglet entier s’appelait « Seguimiento de avispas », alors qu’il traite d’une espèce de frelon. Elle appelait aussi un cadre de couvain un cadre de tableau. Android avait tout juste, ce qui a permis de le voir.',
          'La aplicación de iPhone en español llamaba avispa a un avispón. La pestaña entera se llamaba «Seguimiento de avispas», y trata de una especie de avispón. También llamaba marco a un cuadro de cría. Android lo tenía todo bien, y así se vio.',
          'Hiszpańska aplikacja na iPhone’a nazywała szerszenia osą. Cała zakładka nazywała się „Seguimiento de avispas”, a dotyczy jednego gatunku szerszenia. Ramkę z czerwiem nazywała ramą obrazu. Android miał wszystko dobrze — i tak to wyszło.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'The hornet tracker had a different name on every platform, in every language. On three of the five the apps dropped “Asian”, which is the part that matters: the European hornet is protected and must not be trapped. It is now called the same thing everywhere, and that name says which species it is about.',
          'Der Hornissen-Tracker hieß auf jeder Plattform anders, in jeder Sprache. In drei von fünf ließen die Apps „asiatisch“ weg, und genau darauf kommt es an: die europäische Hornisse ist geschützt und darf nicht gefangen werden. Jetzt heißt er überall gleich, und der Name sagt, um welche Art es geht.',
          'Le suivi des frelons portait un nom différent sur chaque plateforme, dans chaque langue. Dans trois langues sur cinq, les applications omettaient « asiatique », ce qui est précisément ce qui compte : le frelon d’Europe est protégé et ne doit pas être piégé. Il porte désormais partout le même nom, et ce nom dit de quelle espèce il s’agit.',
          'El rastreador de avispas se llamaba distinto en cada plataforma y en cada idioma. En tres de los cinco, las apps omitían «asiática», que es justo lo que importa: el avispón europeo está protegido y no se debe atrapar. Ahora se llama igual en todas partes, y el nombre dice de qué especie se trata.',
          'Tropiciel szerszeni nazywał się inaczej na każdej platformie i w każdym języku. W trzech z pięciu aplikacje pomijały „azjatycki”, a to właśnie jest istotne: szerszeń europejski jest chroniony i nie wolno go odławiać. Teraz nazywa się wszędzie tak samo, i ta nazwa mówi, o jaki gatunek chodzi.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          'Android and the iPhone said different things in 109 places where the English was identical. German used two different words for an inspection, and each app contradicted itself about whether a frame of brood is a comb or a wooden frame — in opposite directions. Polish, for what it is worth, had not a single difference.',
          'Android und iPhone sagten an 109 Stellen Verschiedenes, wo das Englische identisch war. Deutsch benutzte zwei Wörter für eine Kontrolle, und jede App widersprach sich selbst, ob eine Brutwabe eine Wabe oder ein Rähmchen ist — und zwar jeweils andersherum. Polnisch hatte, der Ordnung halber, keine einzige Abweichung.',
          'Android et l’iPhone disaient des choses différentes à 109 endroits où l’anglais était identique. L’allemand employait deux mots pour une visite, et chaque application se contredisait sur la nature d’un cadre de couvain — chacune dans l’autre sens. Le polonais, pour mémoire, n’avait pas une seule différence.',
          'Android y el iPhone decían cosas distintas en 109 sitios donde el inglés era idéntico. El alemán usaba dos palabras para una revisión, y cada aplicación se contradecía sobre qué es un cuadro de cría, cada una al revés de la otra. El polaco, para que quede dicho, no tenía ni una sola diferencia.',
          'Android i iPhone mówiły co innego w 109 miejscach, gdzie angielski był identyczny. Niemiecki używał dwóch słów na przegląd, a każda aplikacja sama sobie przeczyła, czym jest ramka z czerwiem — każda odwrotnie. Polski, dla porządku, nie miał ani jednej różnicy.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          'Every link in the website’s navigation dropped the language. It was invisible in normal use, because a cookie redirected you back; it broke when someone sent you a page in their language and your browser was set to another, and it meant search engines never saw the translated site link to itself.',
          'Jeder Link in der Navigation der Website verlor die Sprache. Im Alltag war das nicht zu sehen, weil ein Cookie zurückleitete; es brach, wenn jemand dir eine Seite in seiner Sprache schickte und dein Browser auf eine andere stand — und es hieß, dass Suchmaschinen die übersetzte Website nie auf sich selbst verweisen sahen.',
          'Chaque lien de la navigation du site perdait la langue. Invisible à l’usage, parce qu’un cookie vous ramenait ; cassé dès que quelqu’un vous envoyait une page dans sa langue alors que votre navigateur était dans une autre. Et les moteurs de recherche ne voyaient jamais le site traduit se lier à lui-même.',
          'Todos los enlaces de la navegación del sitio perdían el idioma. No se notaba en el uso normal, porque una cookie te devolvía; se rompía cuando alguien te enviaba una página en su idioma y tu navegador estaba en otro. Y los buscadores nunca veían el sitio traducido enlazarse a sí mismo.',
          'Każdy link w nawigacji strony tracił język. W normalnym użyciu nie było tego widać, bo ciasteczko cofało cię z powrotem; psuło się, gdy ktoś przysłał ci stronę w swoim języku, a twoja przeglądarka była w innym. I wyszukiwarki nigdy nie widziały, by przetłumaczona strona linkowała do siebie.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Eleven public pages now carry a title and a description of their own, in all five languages. They all shared the home page’s before, so a browser with several tabs open showed the same words on each.',
          'Elf öffentliche Seiten tragen jetzt einen eigenen Titel und eine eigene Beschreibung, in allen fünf Sprachen. Vorher teilten sie den der Startseite — wer mehrere Reiter offen hatte, sah auf jedem dieselben Worte.',
          'Onze pages publiques ont désormais leur propre titre et leur propre description, dans les cinq langues. Elles partageaient celui de l’accueil : avec plusieurs onglets ouverts, on lisait les mêmes mots sur chacun.',
          'Once páginas públicas tienen ya título y descripción propios, en los cinco idiomas. Antes compartían el de la portada: con varias pestañas abiertas se leían las mismas palabras en todas.',
          'Jedenaście publicznych stron ma teraz własny tytuł i opis, we wszystkich pięciu językach. Wcześniej dzieliły tytuł strony głównej — przy kilku otwartych kartach na każdej było to samo.',
        ),
      },
    ],
  },
  {
    date: '2026-11-09',
    title: t(
      'The scanner shows you where to aim',
      'Der Scanner zeigt, wohin du zielen sollst',
      'Le scanner montre où viser',
      'El escáner muestra dónde apuntar',
      'Skaner pokazuje, gdzie celować',
    ),
    items: [
      {
        kind: 'fixed',
        text: t(
          'The scan screen on Android showed a live camera picture and nothing else: no frame to aim with, and no line saying what it wanted. It now draws an amber frame and the sentence iPhone has always shown. The frame was in the code from the beginning — drawn in a colour with no opacity, so it was never once visible on a phone.',
          'Der Scan-Bildschirm auf Android zeigte ein Kamerabild und sonst nichts: keinen Rahmen zum Zielen und keinen Satz, der sagt, was er will. Jetzt zeichnet er einen amberfarbenen Rahmen und den Satz, den das iPhone immer schon zeigt. Den Rahmen gab es von Anfang an im Code — in einer Farbe ohne Deckkraft, also war er auf keinem Telefon je zu sehen.',
          'L’écran de scan sur Android affichait une image de la caméra et rien d’autre : aucun cadre pour viser, aucune phrase disant ce qu’il attendait. Il dessine désormais un cadre ambre et la phrase que l’iPhone affiche depuis toujours. Le cadre était dans le code depuis le début — dessiné dans une couleur sans opacité, donc jamais visible sur un téléphone.',
          'La pantalla de escaneo en Android mostraba una imagen de la cámara y nada más: ni marco para apuntar, ni una frase que dijera qué quería. Ahora dibuja un marco ámbar y la frase que el iPhone ha mostrado siempre. El marco estaba en el código desde el principio — dibujado en un color sin opacidad, así que nunca llegó a verse en un teléfono.',
          'Ekran skanowania na Androidzie pokazywał obraz z aparatu i nic poza tym: żadnej ramki do celowania ani zdania mówiącego, czego oczekuje. Teraz rysuje bursztynową ramkę i zdanie, które iPhone pokazuje od zawsze. Ramka była w kodzie od początku — narysowana w kolorze bez krycia, więc nigdy nie pojawiła się na żadnym telefonie.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          'Four screens showed a value from the server instead of its translation: the hive type on the Android hive list, the queen colour on an Android inspection, and the colony mood on the iPhone hive page and in its statistics. A German beekeeper read "Top Bar" where the edit dialog on the same screen said "Oberträgerbeute". The translations existed the whole time — nothing looked them up.',
          'Vier Bildschirme zeigten einen Wert vom Server statt seiner Übersetzung: den Beutentyp in der Android-Volksliste, die Königinnenfarbe in einer Android-Kontrolle und die Stimmung des Volkes auf der iPhone-Volkseite und in deren Statistik. Ein deutscher Imker las „Top Bar“, wo der Bearbeiten-Dialog auf demselben Bildschirm „Oberträgerbeute“ sagte. Die Übersetzungen gab es die ganze Zeit — niemand schlug sie nach.',
          'Quatre écrans affichaient une valeur du serveur au lieu de sa traduction : le type de ruche dans la liste Android, la couleur de la reine dans une visite Android, et l\'humeur de la colonie sur la page ruche de l\'iPhone et dans ses statistiques. Un apiculteur allemand lisait « Top Bar » là où la boîte d\'édition du même écran disait « Oberträgerbeute ». Les traductions existaient depuis toujours — personne ne les consultait.',
          'Cuatro pantallas mostraban un valor del servidor en lugar de su traducción: el tipo de colmena en la lista de Android, el color de la reina en una revisión de Android, y el humor de la colonia en la página de colmena del iPhone y en sus estadísticas. Un apicultor alemán leía «Top Bar» donde el diálogo de edición de la misma pantalla decía «Oberträgerbeute». Las traducciones existían desde siempre — nadie las consultaba.',
          'Cztery ekrany pokazywały wartość z serwera zamiast jej tłumaczenia: typ ula na androidowej liście rodzin, kolor matki w androidowym przeglądzie oraz nastrój rodziny na iPhone\'owej stronie rodziny i w jej statystykach. Niemiecki pszczelarz czytał „Top Bar” tam, gdzie okno edycji na tym samym ekranie mówiło „Oberträgerbeute”. Tłumaczenia istniały przez cały czas — nikt do nich nie sięgał.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          'Six labels on Android — hive type, forage, two hornet statuses, an advice label — were drawn as chips, which are buttons. They rippled when tapped and did nothing, and a screen reader offered each one as something to activate. They are labels now, as they always were on iPhone.',
          'Sechs Beschriftungen auf Android — Beutentyp, Tracht, zwei Hornissen-Status, ein Hinweis-Etikett — waren als Chips gezeichnet, und Chips sind Schaltflächen. Sie reagierten auf einen Tipp und taten nichts, und die Sprachausgabe bot jede davon als etwas zum Auslösen an. Jetzt sind es Beschriftungen, so wie auf dem iPhone immer schon.',
          'Six libellés sur Android — type de ruche, miellée, deux statuts de frelon, une étiquette de conseil — étaient dessinés comme des chips, c\'est-à-dire des boutons. Ils réagissaient au toucher sans rien faire, et un lecteur d\'écran proposait chacun comme une action. Ce sont désormais des libellés, comme sur iPhone depuis toujours.',
          'Seis etiquetas en Android — tipo de colmena, floración, dos estados de avispa, una etiqueta de consejo — estaban dibujadas como chips, que son botones. Respondían al toque sin hacer nada, y un lector de pantalla ofrecía cada una como algo que activar. Ahora son etiquetas, como siempre lo fueron en el iPhone.',
          'Sześć etykiet na Androidzie — typ ula, pożytek, dwa statusy szerszeń, etykieta porady — narysowano jako chipy, czyli przyciski. Reagowały na dotknięcie i nic nie robiły, a czytnik ekranu oferował każdą jako coś do uruchomienia. Teraz są etykietami, tak jak na iPhonie od zawsze.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'The Scan tab on iPhone opens the camera, as it does on Android. It used to be a page with a glyph, a sentence and a button, with the scanner behind it in a sheet — one tap too many at the hive, in gloves. What the page said is now drawn over the preview.',
          'Der Scan-Reiter auf dem iPhone öffnet die Kamera, wie auf Android. Er war eine Seite mit Glyphe, Satz und Knopf, den Scanner dahinter in einem Blatt — am Volk, mit Handschuhen, ein Tipp zu viel. Was die Seite sagte, steht jetzt über der Vorschau.',
          'L\'onglet Scan sur iPhone ouvre la caméra, comme sur Android. C\'était une page avec un glyphe, une phrase et un bouton, le scanner derrière dans une feuille — une tape de trop à la ruche, avec des gants. Ce que disait la page est désormais dessiné sur l\'aperçu.',
          'La pestaña Escanear en el iPhone abre la cámara, como en Android. Era una página con un glifo, una frase y un botón, con el escáner detrás en una hoja — un toque de más en la colmena, con guantes. Lo que decía la página se dibuja ahora sobre la vista previa.',
          'Zakładka Skanuj na iPhonie otwiera aparat, tak jak na Androidzie. Była stroną z symbolem, zdaniem i przyciskiem, a skaner czekał za nią w arkuszu — o jedno dotknięcie za dużo przy ulu, w rękawicach. To, co mówiła strona, rysuje się teraz nad podglądem.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'The German iPhone app said "Sie" on a dozen screens and "du" on the rest, often one after the other. It now says "du" everywhere, as the website and the Android app already did.',
          'Die deutsche iPhone-App sagte auf einem Dutzend Bildschirmen „Sie" und auf dem Rest „du", oft direkt nacheinander. Jetzt sagt sie überall „du", so wie die Website und die Android-App es schon taten.',
          'L’application iPhone en allemand disait « Sie » sur une douzaine d’écrans et « du » sur les autres, souvent l’un après l’autre. Elle dit désormais « du » partout, comme le site et l’application Android le faisaient déjà.',
          'La aplicación de iPhone en alemán decía «Sie» en una docena de pantallas y «du» en el resto, a menudo una tras otra. Ahora dice «du» en todas partes, como ya hacían la web y la aplicación de Android.',
          'Niemiecka aplikacja na iPhone’a mówiła „Sie" na kilkunastu ekranach i „du" na pozostałych, często jedno po drugim. Teraz wszędzie mówi „du", tak jak strona i aplikacja na Androida już to robiły.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          'Two pictures in the help pages had not been retaken since June and showed an interface that no longer exists — a navigation bar with three tabs instead of five. Their captions described fields that were not in the picture. Both are now taken by the same script as the rest, so they cannot fall behind again.',
          'Zwei Bilder in den Hilfeseiten waren seit Juni nicht neu aufgenommen worden und zeigten eine Oberfläche, die es nicht mehr gibt — eine Navigationsleiste mit drei statt fünf Reitern. Ihre Unterschriften beschrieben Felder, die gar nicht im Bild waren. Beide nimmt jetzt dasselbe Skript auf wie den Rest, damit sie nicht wieder zurückfallen können.',
          'Deux images des pages d’aide n’avaient pas été reprises depuis juin et montraient une interface qui n’existe plus — une barre de navigation à trois onglets au lieu de cinq. Leurs légendes décrivaient des champs absents de l’image. Les deux sont désormais prises par le même script que les autres et ne peuvent plus prendre de retard.',
          'Dos imágenes de las páginas de ayuda no se habían vuelto a tomar desde junio y mostraban una interfaz que ya no existe — una barra de navegación con tres pestañas en lugar de cinco. Sus pies describían campos que no estaban en la imagen. Ahora las toma el mismo script que el resto, así que no pueden volver a quedarse atrás.',
          'Dwa obrazy na stronach pomocy nie były odnawiane od czerwca i pokazywały interfejs, który już nie istnieje — pasek nawigacji z trzema zakładkami zamiast pięciu. Ich podpisy opisywały pola, których na obrazie nie było. Oba wykonuje teraz ten sam skrypt co pozostałe, więc nie mogą znów zostać w tyle.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          'A sign-in that was refused said "HTTP 401 Unauthorized" on Android and "Session expired. Please sign in again" on iPhone. The first said nothing at all; the second was untrue and asked you to do the very thing you had just done. Both now show the sentence the server wrote — wrong password, unknown address, a mail that was never confirmed. Behind the iPhone one sat a larger fault: the app looked for the server’s message in a field the backend never sends, so every rejected action came out as "Unknown error", not only at sign-in.',
          'Eine abgelehnte Anmeldung sagte auf Android „HTTP 401 Unauthorized“ und auf dem iPhone „Sitzung abgelaufen. Bitte erneut anmelden“. Das erste sagte gar nichts; das zweite stimmte nicht und verlangte genau das, was man gerade getan hatte. Beide zeigen jetzt den Satz, den der Server geschrieben hat — falsches Passwort, unbekannte Adresse, eine nie bestätigte Mail. Hinter dem iPhone-Fall lag ein größerer Fehler: die App suchte die Servermeldung in einem Feld, das das Backend nie sendet, also kam jede abgelehnte Handlung als „Unbekannter Fehler“ heraus, nicht nur beim Anmelden.',
          'Une connexion refusée affichait « HTTP 401 Unauthorized » sur Android et « Session expirée. Veuillez vous reconnecter » sur iPhone. La première ne disait rien ; la seconde était fausse et demandait précisément ce que l’on venait de faire. Les deux affichent désormais la phrase écrite par le serveur — mot de passe erroné, adresse inconnue, courriel jamais confirmé. Derrière le cas iPhone se cachait un défaut plus large : l’application cherchait le message du serveur dans un champ que le backend n’envoie jamais, et toute action refusée ressortait en « Erreur inconnue », pas seulement à la connexion.',
          'Un inicio de sesión rechazado decía «HTTP 401 Unauthorized» en Android y «Sesión caducada. Vuelve a iniciar sesión» en el iPhone. El primero no decía nada; el segundo no era cierto y pedía justo lo que acababas de hacer. Ambos muestran ahora la frase que escribió el servidor — contraseña incorrecta, dirección desconocida, un correo nunca confirmado. Detrás del caso del iPhone había un fallo mayor: la aplicación buscaba el mensaje del servidor en un campo que el backend nunca envía, así que toda acción rechazada salía como «Error desconocido», y no solo al iniciar sesión.',
          'Odrzucone logowanie pokazywało „HTTP 401 Unauthorized” na Androidzie i „Sesja wygasła. Zaloguj się ponownie” na iPhonie. Pierwsze nie mówiło nic; drugie było nieprawdą i żądało dokładnie tego, co właśnie zrobiłeś. Oba pokazują teraz zdanie napisane przez serwer — błędne hasło, nieznany adres, niepotwierdzona poczta. Za przypadkiem iPhone’a stał większy błąd: aplikacja szukała komunikatu serwera w polu, którego backend nigdy nie wysyła, więc każde odrzucone działanie wychodziło jako „Nieznany błąd”, nie tylko przy logowaniu.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          'The iPhone app called itself 1.0.0 in Settings and in TestFlight, whichever build it was, while Android had reached 1.0.2. Only the build number ever moved; the version a person reads had not been raised since it was first written down. A tester reporting a problem with "1.0.0" was telling us nothing, so the two platforms are now pinned against each other and cannot drift again.',
          'Die iPhone-App nannte sich in den Einstellungen und in TestFlight 1.0.0, egal welcher Build es war, während Android bei 1.0.2 stand. Bewegt hat sich immer nur die Build-Nummer; die Version, die ein Mensch liest, war seit dem ersten Eintrag nie hochgezählt worden. Ein Tester, der ein Problem mit „1.0.0“ meldet, sagt uns damit nichts, also sind die beiden Plattformen jetzt aneinander festgemacht und können nicht wieder auseinanderlaufen.',
          'L’application iPhone s’appelait 1.0.0 dans les réglages et dans TestFlight, quelle que soit la version, alors qu’Android était à 1.0.2. Seul le numéro de build bougeait ; la version que lit une personne n’avait jamais été augmentée depuis sa première écriture. Un testeur signalant un problème avec « 1.0.0 » ne nous apprenait rien ; les deux plateformes sont désormais liées et ne peuvent plus diverger.',
          'La aplicación de iPhone se llamaba 1.0.0 en los ajustes y en TestFlight, fuera la compilación que fuera, mientras Android llegaba a 1.0.2. Solo se movía el número de compilación; la versión que lee una persona no se había subido desde que se escribió por primera vez. Un probador que informa de un problema con «1.0.0» no nos dice nada, así que ambas plataformas están ahora sujetas la una a la otra y no pueden volver a separarse.',
          'Aplikacja na iPhone’a nazywała się 1.0.0 w ustawieniach i w TestFlight, niezależnie od kompilacji, podczas gdy Android dotarł do 1.0.2. Zmieniał się tylko numer kompilacji; wersja, którą czyta człowiek, nie była podnoszona od pierwszego zapisu. Tester zgłaszający problem z „1.0.0” nie mówił nam nic, więc obie platformy są teraz związane ze sobą i nie mogą się znów rozejść.',
        ),
      },
    ],
  },
  {
    date: '2026-11-06',
    title: t(
      'Say whether the beekeeping year fits where you are',
      'Sag, ob das Imkerjahr bei dir passt',
      'Dites si l’année apicole correspond chez vous',
      'Di si el año apícola encaja donde estás',
      'Powiedz, czy rok pasieczny pasuje u Ciebie',
    ),
    items: [
      {
        kind: 'added',
        text: t(
          'A questionnaire about all 38 entries of the beekeeping year, open to anybody and without an account. Give a country and a postal code and you rate the dates you would actually see, not the ones written for central Germany: it fits, it happens later here, it happens earlier here, it is not done here at all — with a size in days and a note if you have one. Entries you leave alone are not sent.',
          'Ein Fragebogen zu allen 38 Einträgen des Imkerjahres, offen für alle und ohne Konto. Mit Land und Postleitzahl bewertest du die Daten, die du wirklich sehen würdest, nicht die für Mitteldeutschland geschriebenen: passt, bei mir später, bei mir früher, gilt hier nicht — mit einer Größe in Tagen und einer Anmerkung, wenn du eine hast. Einträge, die du auslässt, werden nicht gesendet.',
          'Un questionnaire sur les 38 entrées de l’année apicole, ouvert à tous et sans compte. Avec un pays et un code postal, vous évaluez les dates que vous verriez vraiment, et non celles écrites pour le centre de l’Allemagne : ça colle, plus tard ici, plus tôt ici, pas d’usage ici — avec une durée en jours et une remarque si vous en avez une. Les entrées que vous laissez ne sont pas envoyées.',
          'Un cuestionario sobre las 38 entradas del año apícola, abierto a cualquiera y sin cuenta. Con un país y un código postal valoras las fechas que verías de verdad, no las escritas para el centro de Alemania: encaja, más tarde aquí, más temprano aquí, aquí no se hace — con un tamaño en días y una nota si la tienes. Las entradas que dejes sin marcar no se envían.',
          'Ankieta o wszystkich 38 wpisach roku pasiecznego, otwarta dla każdego i bez konta. Po podaniu kraju i kodu pocztowego oceniasz daty, które naprawdę byś widział, a nie napisane dla środkowych Niemiec: pasuje, u mnie później, u mnie wcześniej, tu się tego nie robi — z wielkością w dniach i uwagą, jeśli ją masz. Pominięte wpisy nie są wysyłane.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Both apps ask the question where you are already looking at the dates: under the year, in the list and in the picture, "Do these dates fit where your bees are?" opens the questionnaire in the browser.',
          'Beide Apps stellen die Frage dort, wo du die Daten schon ansiehst: unter dem Jahr, in der Liste wie im Bild, öffnet „Passen diese Daten dort, wo deine Bienen stehen?" den Fragebogen im Browser.',
          'Les deux applications posent la question là où vous regardez déjà les dates : sous l’année, en liste comme en image, « Ces dates correspondent-elles à l’endroit où sont vos abeilles ? » ouvre le questionnaire dans le navigateur.',
          'Ambas aplicaciones hacen la pregunta donde ya estás mirando las fechas: bajo el año, en la lista y en la imagen, «¿Encajan estas fechas donde están tus abejas?» abre el cuestionario en el navegador.',
          'Obie aplikacje zadają pytanie tam, gdzie już patrzysz na daty: pod rokiem, na liście i na obrazie, „Czy te daty pasują tam, gdzie stoją Twoje pszczoły?" otwiera ankietę w przeglądarce.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Nothing you send moves a date on its own. Ratings within 150 km of each other are grouped, a group needs at least five beekeepers, and the median correction then waits for somebody who knows the region. Once approved, the timeline says how many beekeepers it rests on.',
          'Nichts, was du sendest, verschiebt allein ein Datum. Bewertungen im Umkreis von 150 km werden zusammengefasst, eine Gruppe braucht mindestens fünf Imker, und die mittlere Korrektur wartet dann auf jemanden, der die Region kennt. Ist sie freigegeben, nennt der Zeitstrahl, auf wie vielen Imkern sie beruht.',
          'Rien de ce que vous envoyez ne déplace une date à soi seul. Les avis à moins de 150 km les uns des autres sont regroupés, un groupe a besoin d’au moins cinq apiculteurs, et la correction médiane attend ensuite quelqu’un qui connaît la région. Une fois validée, la chronologie indique sur combien d’apiculteurs elle repose.',
          'Nada de lo que envíes mueve una fecha por sí solo. Las valoraciones a menos de 150 km entre sí se agrupan, un grupo necesita al menos cinco apicultores, y la corrección mediana espera después a alguien que conozca la región. Una vez aprobada, la cronología dice en cuántos apicultores se apoya.',
          'Nic, co wyślesz, samo nie przesuwa daty. Oceny w promieniu 150 km od siebie są grupowane, grupa potrzebuje co najmniej pięciu pszczelarzy, a mediana poprawki czeka potem na kogoś, kto zna region. Po zatwierdzeniu oś czasu podaje, na ilu pszczelarzach się opiera.',
        ),
      },
    ],
  },
  {
    date: '2026-11-05',
    title: t(
      'The year as a picture on the iPhone and on Android too',
      'Das Jahr als Bild auch auf dem iPhone und auf Android',
      'L’année en image sur iPhone et sur Android aussi',
      'El año como imagen también en el iPhone y en Android',
      'Rok jako obraz także na iPhonie i na Androidzie',
    ),
    items: [
      {
        kind: 'added',
        text: t(
          'The beekeeping year as a ribbon in both apps, under the same two names as on the website: List and Overview. On a phone the picture is drawn wider than the screen and the year is dragged sideways — a month gets 90 points instead of 30, which is the difference between readable and not.',
          'Das Imkerjahr als Band in beiden Apps, unter denselben zwei Namen wie auf der Webseite: Liste und Übersicht. Auf dem Handy wird das Bild breiter als der Bildschirm gezeichnet und das Jahr seitlich durchgezogen — ein Monat bekommt 90 statt 30 Punkte, und das ist der Unterschied zwischen lesbar und nicht.',
          'L’année apicole en ruban dans les deux applications, sous les mêmes deux noms que sur le site : Liste et Vue d’ensemble. Sur un téléphone, l’image est dessinée plus large que l’écran et l’année se fait glisser latéralement — un mois reçoit 90 points au lieu de 30, ce qui fait la différence entre lisible et non.',
          'El año apícola como banda en ambas aplicaciones, con los mismos dos nombres que en el sitio: Lista y Vista general. En el móvil la imagen se dibuja más ancha que la pantalla y el año se arrastra de lado: un mes recibe 90 puntos en vez de 30, que es la diferencia entre legible y no.',
          'Rok pasieczny jako wstęga w obu aplikacjach, pod tymi samymi dwiema nazwami co na stronie: Lista i Przegląd. Na telefonie obraz jest rysowany szerzej niż ekran, a rok przeciąga się na boki — miesiąc dostaje 90 punktów zamiast 30, a to różnica między czytelnym i nieczytelnym.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'The photographs are in both apps as well, in the list and in the picture: the plant in flower, a capped queen cell, the mite on a bee. They are carried inside the app rather than fetched, so they are there at the apiary where there is no signal.',
          'Die Fotos sind nun auch in beiden Apps, in der Liste und im Bild: die Pflanze in Blüte, eine verdeckelte Weiselzelle, die Milbe auf der Biene. Sie liegen in der App und werden nicht geladen — damit sie am Bienenstand da sind, wo kein Netz ist.',
          'Les photos sont aussi dans les deux applications, dans la liste et dans l’image : la plante en fleur, une cellule royale operculée, le varroa sur une abeille. Elles sont embarquées dans l’application et non téléchargées, pour être là au rucher où il n’y a pas de réseau.',
          'Las fotos están también en ambas aplicaciones, en la lista y en la imagen: la planta en flor, una celda real operculada, el ácaro sobre una abeja. Van dentro de la aplicación y no se descargan, para que estén en el colmenar donde no hay cobertura.',
          'Zdjęcia są też w obu aplikacjach, na liście i na obrazie: roślina w kwiecie, zasklepiony matecznik, roztocz na pszczole. Są w aplikacji, a nie pobierane — żeby były w pasiece, gdzie nie ma sieci.',
        ),
      },
    ],
  },
  {
    date: '2026-11-05',
    title: t(
      'The beekeeping year as a picture, and a way to tell us things',
      'Das Imkerjahr als Bild, und ein Weg, uns etwas zu sagen',
      'L’année apicole en image, et un moyen de nous dire les choses',
      'El año apícola como imagen, y una forma de decirnos cosas',
      'Rok pasieczny jako obraz i sposób, by nam coś powiedzieć',
    ),
    items: [
      {
        kind: 'added',
        text: t(
          'Send feedback, in Settings right under Help, on the website and in both apps. On Android it opens the Play listing, on the iPhone and the website a mail with the version already in the subject.',
          'Rückmeldung geben, in den Einstellungen direkt unter Hilfe, auf der Webseite und in beiden Apps. Auf Android öffnet es den Play-Eintrag, auf dem iPhone und der Webseite eine Mail mit der Version schon im Betreff.',
          'Envoyer un retour, dans les réglages juste sous l’aide, sur le site et dans les deux applications. Sur Android cela ouvre la fiche Play, sur iPhone et sur le site un courriel avec la version déjà dans l’objet.',
          'Enviar comentarios, en los ajustes justo debajo de la ayuda, en el sitio y en ambas aplicaciones. En Android abre la ficha de Play; en el iPhone y en el sitio, un correo con la versión ya en el asunto.',
          'Prześlij opinię, w ustawieniach tuż pod pomocą, na stronie i w obu aplikacjach. Na Androidzie otwiera wpis w Play, na iPhonie i na stronie wiadomość z wersją już w temacie.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'The beekeeping year as a ribbon on the website: the whole year in one picture, a row per subject and a bar per job, with a photograph of the thing itself — the plant in flower, a capped queen cell, the mite on a bee. On a phone the year runs down the screen instead.',
          'Das Imkerjahr als Band auf der Webseite: das ganze Jahr in einem Bild, eine Zeile je Thema und ein Balken je Aufgabe, mit einem Foto der Sache selbst — die Pflanze in Blüte, eine verdeckelte Weiselzelle, die Milbe auf der Biene. Auf dem Handy läuft das Jahr stattdessen senkrecht.',
          'L’année apicole en ruban sur le site : toute l’année en une image, une ligne par sujet et une barre par travail, avec une photo de la chose même — la plante en fleur, une cellule royale operculée, le varroa sur une abeille. Sur téléphone, l’année défile verticalement.',
          'El año apícola como banda en el sitio: todo el año en una imagen, una fila por tema y una barra por tarea, con una foto de la cosa misma: la planta en flor, una celda real operculada, el ácaro sobre una abeja. En el móvil el año va en vertical.',
          'Rok pasieczny jako wstęga na stronie: cały rok na jednym obrazie, wiersz na temat i belka na zadanie, ze zdjęciem samej rzeczy — rośliny w kwiecie, zasklepionego matecznika, roztocza na pszczole. Na telefonie rok biegnie pionowo.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'The beekeeping year now says when to harvest chestnut, lavender and sunflower honey. Those three were moves with no harvest: the year said where to drive and never what to do with what came of it.',
          'Das Imkerjahr sagt jetzt, wann Kastanien-, Lavendel- und Sonnenblumenhonig zu ernten ist. Diese drei waren Wanderungen ohne Ernte: Das Jahr sagte, wohin zu fahren ist, und nie, was mit dem wird, was dabei herauskommt.',
          'L’année apicole dit désormais quand récolter les miels de châtaignier, de lavande et de tournesol. Ces trois-là étaient des transhumances sans récolte : l’année disait où aller et jamais quoi faire de ce qui en venait.',
          'El año apícola ya dice cuándo cosechar las mieles de castaño, lavanda y girasol. Esas tres eran traslados sin cosecha: el año decía adónde ir y nunca qué hacer con lo que salía de ello.',
          'Rok pasieczny mówi teraz, kiedy zbierać miód kasztanowy, lawendowy i słonecznikowy. Te trzy były wędrówkami bez zbioru: rok mówił, dokąd jechać, i nigdy, co zrobić z tym, co z tego wyszło.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          '"Last honey harvest of the season" was not the last: lavender, sunflower and heather are all harvested after it. It is called "Supers off: treatment and feeding start now", which is what it is for — it sits in late July because the varroa treatment and the feeding follow it, not because nothing else is harvested.',
          '„Letzte Honigernte der Saison" war nicht die letzte: Lavendel, Sonnenblume und Heide werden danach geerntet. Sie heißt jetzt „Honigräume ab: jetzt beginnen Behandlung und Fütterung", und das ist auch ihr Zweck — sie steht Ende Juli, weil Varroabehandlung und Fütterung folgen, nicht weil nichts mehr geerntet wird.',
          '« Dernière récolte de la saison » ne l’était pas : lavande, tournesol et bruyère se récoltent après. Elle s’appelle désormais « Hausses retirées : traitement et nourrissement commencent », ce qui est sa raison d’être — fin juillet parce que le traitement et le nourrissement suivent, non parce que plus rien ne se récolte.',
          '«Última cosecha de la temporada» no lo era: lavanda, girasol y brezo se cosechan después. Ahora se llama «Alzas fuera: empiezan el tratamiento y la alimentación», que es su razón de ser: está a finales de julio porque el tratamiento y la alimentación vienen después, no porque ya no se coseche nada.',
          '„Ostatnie miodobranie sezonu" nie było ostatnie: lawendę, słonecznik i wrzos zbiera się po nim. Nazywa się teraz „Nadstawki zdjęte: zaczynają się zabieg i karmienie" — i po to jest: stoi pod koniec lipca, bo po nim następują zabieg i karmienie, a nie dlatego, że nic się już nie zbiera.',
        ),
      },
    ],
  },
  {
    date: '2026-10-07',
    title: t(
      'Home screen, treatments, moving hives and working together',
      'Startseite, Behandlungen, Verlagern und Zusammenarbeiten',
      'Accueil, traitements, déplacements et travail à plusieurs',
      'Inicio, tratamientos, traslados y trabajo en equipo',
      'Ekran główny, zabiegi, przewożenie rodzin i wspólna praca',
    ),
    items: [
      {
        kind: 'added',
        text: t(
          'Home screen at the top of the apiary list: the next inspection, the state of the hives and upcoming treatments, and now and then an announcement card. No advertising network, no tracking.',
          'Startseite oben in der Bienenstand-Liste: die nächste Kontrolle, der Zustand der Völker und anstehende Behandlungen, und ab und zu eine Mitteilung. Kein Werbenetzwerk, kein Tracking.',
          'Accueil en haut de la liste des ruchers : la prochaine visite, l’état des ruches et les traitements à venir, et de temps en temps une annonce. Pas de régie publicitaire, pas de suivi.',
          'Inicio al principio de la lista de colmenares: la próxima revisión, el estado de las colmenas y los tratamientos próximos, y de vez en cuando un anuncio. Sin red publicitaria y sin rastreo.',
          'Ekran główny na górze listy pasiek: następny przegląd, stan rodzin i nadchodzące zabiegi, a od czasu do czasu karta z ogłoszeniem. Bez sieci reklamowej, bez śledzenia.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Planned treatments for a hive or for all hives of an apiary, with product, day and note. Mark them done, reopen or delete them.',
          'Geplante Behandlungen für ein Volk oder alle Völker eines Bienenstands, mit Mittel, Tag und Notiz. Erledigen, wieder öffnen oder löschen.',
          'Traitements planifiés pour une ruche ou toutes les ruches d’un rucher, avec produit, jour et note. Les marquer comme faits, les rouvrir ou les supprimer.',
          'Tratamientos planificados para una colmena o todas las de un colmenar, con producto, día y nota. Marcarlos como hechos, reabrirlos o eliminarlos.',
          'Zaplanowane zabiegi dla rodziny lub dla wszystkich rodzin pasieki, z preparatem, dniem i notatką. Oznaczaj je jako zrobione, otwieraj ponownie lub usuwaj.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Moving hives between your apiaries, with day, forage and note. Each hive keeps the history of where it has stood, a map draws every journey, and a shortcut sends hives back to where they came from.',
          'Völker zwischen deinen Bienenständen verlagern, mit Tag, Tracht und Notiz. Jedes Volk behält die Geschichte seiner Standorte, eine Karte zeichnet jeden Weg, und eine Schnellwahl schickt Völker dorthin zurück, wo sie herkamen.',
          'Déplacer des ruches entre vos ruchers, avec jour, miellée et note. Chaque ruche garde l’historique de ses emplacements, une carte dessine chaque parcours et un raccourci les renvoie d’où elles venaient.',
          'Trasladar colmenas entre tus colmenares, con día, flora y nota. Cada colmena conserva el historial de dónde ha estado, un mapa dibuja cada recorrido y un atajo las devuelve a donde estaban.',
          'Przewożenie rodzin między twoimi pasiekami, z dniem, pożytkiem i notatką. Każda rodzina zachowuje historię miejsc, w których stała, mapa rysuje każdą podróż, a skrót odsyła rodziny tam, skąd przyjechały.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Working together: invite another beekeeper by e-mail to an apiary or to single hives. Invitations are accepted in the app, on the website or through the link in the e-mail.',
          'Zusammenarbeiten: Lade einen anderen Imker per E-Mail zu einem Bienenstand oder einzelnen Völkern ein. Einladungen nimmst du in der App, auf der Webseite oder über den Link in der E-Mail an.',
          'Travailler ensemble : invitez un autre apiculteur par e-mail sur un rucher ou sur quelques ruches. Les invitations s’acceptent dans l’application, sur le site ou par le lien de l’e-mail.',
          'Trabajar juntos: invita por correo a otro apicultor a un colmenar o a colmenas sueltas. Las invitaciones se aceptan en la app, en la web o con el enlace del correo.',
          'Wspólna praca: zaproś innego pszczelarza e-mailem do pasieki lub do pojedynczych rodzin. Zaproszenia przyjmuje się w aplikacji, w serwisie lub przez link z e-maila.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'A hive can now be made by hand in both apps: the amber New Hive button on the apiary page, no printed sticker needed. The sticker can still be used to open and set up a hive.',
          'Ein Volk lässt sich jetzt in beiden Apps von Hand anlegen: der bernsteinfarbene Knopf „Neues Volk“ auf der Seite des Bienenstands, ohne gedruckten Aufkleber. Der Aufkleber lässt sich weiter zum Öffnen und Einrichten nutzen.',
          'Une ruche peut maintenant être créée à la main dans les deux applications : le bouton ambre « Nouvelle ruche » sur la page du rucher, sans autocollant imprimé. L’autocollant reste utilisable pour ouvrir et configurer une ruche.',
          'Ahora se puede crear una colmena a mano en ambas apps: el botón ámbar «Nueva colmena» en la página del colmenar, sin pegatina impresa. La pegatina sigue sirviendo para abrir y configurar una colmena.',
          'Rodzinę można teraz założyć ręcznie w obu aplikacjach: bursztynowy przycisk „Nowa rodzina” na stronie pasieki, bez drukowanej naklejki. Naklejka nadal służy do otwarcia i założenia rodziny.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'The beekeeping year: an endless timeline of what to do when, month by month. Feeding with candy in February, the first inspections, swarm control at least every 9 days, drone frames against varroa, when to move for which honey and when to extract it, and the preparation for winter. Set your country and postal code and the dates move to your place.',
          'Das Imkerjahr: ein endloser Zeitstrahl dessen, was wann zu tun ist, Monat für Monat. Im Februar mit Futterteig füttern, die ersten Kontrollen, Schwarmkontrolle spätestens alle 9 Tage, Drohnenrahmen gegen Varroa, wann für welchen Honig zu verlagern und wann er zu schleudern ist, und die Vorbereitung auf den Winter. Lege Land und Postleitzahl fest, und die Termine verschieben sich auf deinen Ort.',
          'L’année apicole : une frise sans fin de ce qu’il y a à faire et quand, mois par mois. Nourrir au candi en février, les premières visites, le contrôle de l’essaimage au moins tous les 9 jours, les cadres à mâles contre le varroa, quand déplacer pour quel miel et quand l’extraire, et la préparation de l’hiver. Indiquez le pays et le code postal et les dates se décalent pour votre lieu.',
          'El año apícola: una línea del tiempo interminable de qué hacer y cuándo, mes a mes. Alimentar con candy en febrero, las primeras revisiones, el control de la enjambrazón como mínimo cada 9 días, los cuadros de zánganos contra la varroa, cuándo trasladar para qué miel y cuándo extraerla, y la preparación del invierno. Indica el país y el código postal y las fechas se adaptan a tu lugar.',
          'Rok pszczelarski: niekończąca się oś czasu tego, co robić i kiedy, miesiąc po miesiącu. Karmienie ciastem cukrowym w lutym, pierwsze przeglądy, kontrola rójki najpóźniej co 9 dni, ramki trutowe przeciw Varroa, kiedy przewozić na jaki miód i kiedy go odwirować, oraz przygotowanie do zimy. Ustaw kraj i kod pocztowy, a terminy przesuną się na twoje miejsce.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Polish: the website, both apps, the e-mails and the beekeeping year are now available in Polish, in addition to English, German, French and Spanish.',
          'Polnisch: Website, beide Apps, die E-Mails und das Imkerjahr gibt es jetzt auch auf Polnisch, zusätzlich zu Englisch, Deutsch, Französisch und Spanisch.',
          'Polonais : le site, les deux applications, les e-mails et l’année apicole existent désormais aussi en polonais, en plus de l’anglais, de l’allemand, du français et de l’espagnol.',
          'Polaco: el sitio web, las dos apps, los correos y el año apícola ya están también en polaco, además de inglés, alemán, francés y español.',
          'Polski: serwis, obie aplikacje, e-maile i rok pszczelarski są teraz dostępne także po polsku, obok angielskiego, niemieckiego, francuskiego i hiszpańskiego.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'Invitations are simpler: whoever signs in with Apple or Google finds an invitation sent to that address waiting in the apiary list, with no link to paste. The envelope icon is gone from the toolbar; a link from an e-mail is still redeemed at the end of the apiary list.',
          'Einladungen sind einfacher: Wer sich mit Apple oder Google anmeldet, findet eine an diese Adresse geschickte Einladung schon in der Liste der Bienenstände, ohne einen Link einzufügen. Das Umschlag-Symbol in der Symbolleiste ist weg; ein Link aus einer E-Mail wird weiter am Ende der Liste der Bienenstände eingelöst.',
          'Les invitations sont plus simples : qui se connecte avec Apple ou Google trouve l’invitation envoyée à cette adresse déjà dans la liste des ruchers, sans lien à coller. L’icône d’enveloppe a quitté la barre ; un lien reçu par e-mail s’utilise toujours à la fin de la liste des ruchers.',
          'Las invitaciones son más sencillas: quien inicia sesión con Apple o Google encuentra la invitación enviada a esa dirección ya en la lista de colmenares, sin pegar ningún enlace. El icono de sobre ya no está en la barra; un enlace de un correo se sigue usando al final de la lista de colmenares.',
          'Zaproszenia są prostsze: kto loguje się przez Apple lub Google, znajdzie zaproszenie wysłane na ten adres już na liście pasiek, bez wklejania linku. Ikona koperty zniknęła z paska narzędzi; link z e-maila nadal realizuje się na końcu listy pasiek.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Delete QR batches that no hive uses.',
          'QR-Batches löschen, die kein Volk benutzt.',
          'Supprimer les lots de QR codes qu’aucune ruche n’utilise.',
          'Eliminar los lotes de QR que ninguna colmena usa.',
          'Usuwanie partii kodów QR, których żadna rodzina nie używa.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Release notes with the full list of features, and help pages for working together, moving hives, the home screen and treatments.',
          'Release Notes mit der vollständigen Funktionsliste und Hilfeseiten zu Zusammenarbeiten, Verlagern, Startseite und Behandlungen.',
          'Notes de version avec la liste complète des fonctions, et des pages d’aide sur le travail à plusieurs, les déplacements, l’accueil et les traitements.',
          'Notas de versión con la lista completa de funciones, y páginas de ayuda sobre trabajo en equipo, traslados, inicio y tratamientos.',
          'Informacje o wersjach z pełną listą funkcji oraz strony pomocy o wspólnej pracy, przewożeniu rodzin, ekranie głównym i zabiegach.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'The Android and iPhone apps now have the same layout: tabs Apiaries, Scan, Hornets, Members and Settings; the same toolbar icons in the same order; the amber create button at the bottom right on every screen; settings in the same order.',
          'Die Apps für Android und iPhone sind jetzt gleich aufgebaut: Reiter Bienenstände, Scannen, Hornissen, Mitglieder und Einstellungen; dieselben Symbole in derselben Reihenfolge; auf jedem Bildschirm der bernsteinfarbene Anlegen-Knopf unten rechts; die Einstellungen in derselben Reihenfolge.',
          'Les applications Android et iPhone sont maintenant construites de la même façon : onglets Ruchers, Scanner, Frelons, Membres et Paramètres ; les mêmes icônes dans le même ordre ; le bouton ambre de création en bas à droite sur chaque écran ; les paramètres dans le même ordre.',
          'Las apps de Android y iPhone ahora están organizadas igual: pestañas Colmenares, Escanear, Avispas, Miembros y Ajustes; los mismos iconos en el mismo orden; el botón ámbar de crear abajo a la derecha en cada pantalla; los ajustes en el mismo orden.',
          'Aplikacje na Androida i iPhone\'a mają teraz ten sam układ: karty Pasieki, Skanuj, Szerszenie, Członkowie i Ustawienia; te same ikony paska narzędzi w tej samej kolejności; bursztynowy przycisk tworzenia w prawym dolnym rogu na każdym ekranie; ustawienia w tej samej kolejności.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'The same words on every surface: apiary, hive and inspection are called the same in the website, both apps and the e-mails, in every language.',
          'Dieselben Wörter überall: Bienenstand, Volk und Kontrolle heißen auf der Webseite, in beiden Apps und in den E-Mails gleich, in jeder Sprache.',
          'Les mêmes mots partout : rucher, ruche et visite s’appellent pareil sur le site, dans les deux applications et dans les e-mails, dans chaque langue.',
          'Las mismas palabras en todas partes: colmenar, colmena y revisión se llaman igual en la web, en ambas apps y en los correos, en cada idioma.',
          'Te same słowa wszędzie: pasieka, rodzina i przegląd nazywają się tak samo w serwisie, w obu aplikacjach i w e-mailach, w każdym języku.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'The regional health map shows each area as a soft, round patch that fades out and blends into its neighbours, instead of hard rectangles. Same on the website, Android and iPhone.',
          'Die regionale Gesundheitskarte zeigt jedes Gebiet als weichen, runden Fleck, der ausläuft und in die Nachbarn übergeht, statt als harte Rechtecke. Auf der Webseite, Android und iPhone gleich.',
          'La carte régionale de santé montre chaque zone comme une tache ronde et douce qui s’estompe et se fond dans ses voisines, au lieu de rectangles durs. Pareil sur le site, Android et iPhone.',
          'El mapa regional de salud muestra cada zona como una mancha redonda y suave que se difumina y se mezcla con las vecinas, en lugar de rectángulos duros. Igual en la web, Android y iPhone.',
          'Regionalna mapa zdrowia pokazuje każdy obszar jako miękką, okrągłą plamę, która zanika i łączy się z sąsiednimi, zamiast ostrych prostokątów. Tak samo w serwisie, na Androidzie i iPhonie.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          'The language picker on Android now switches the language of the app at once.',
          'Die Sprachauswahl auf Android wechselt die Sprache der App jetzt sofort.',
          'Le sélecteur de langue sur Android change maintenant la langue de l’application aussitôt.',
          'El selector de idioma en Android ahora cambia el idioma de la app al instante.',
          'Wybór języka na Androidzie od razu przełącza język aplikacji.',
        ),
      },
    ],
  },
  {
    date: '2026-10-05',
    title: t(
      'Sign in with Apple or Google',
      'Mit Apple oder Google anmelden',
      'Se connecter avec Apple ou Google',
      'Iniciar sesión con Apple o Google',
      'Logowanie przez Apple lub Google',
    ),
    items: [
      {
        kind: 'added',
        text: t(
          'Sign in with your Apple or Google account instead of a password. With the same e-mail address you land in the account you already had. HivePulse only receives your name and address, never a password.',
          'Anmelden mit deinem Apple- oder Google-Konto statt mit Passwort. Mit derselben E-Mail-Adresse landest du in deinem bisherigen Konto. HivePulse erhält nur deinen Namen und deine Adresse, nie ein Passwort.',
          'Connexion avec votre compte Apple ou Google au lieu d’un mot de passe. Avec la même adresse e-mail, vous arrivez dans le compte que vous aviez. HivePulse ne reçoit que votre nom et votre adresse, jamais un mot de passe.',
          'Inicio de sesión con tu cuenta de Apple o Google en lugar de una contraseña. Con el mismo correo entras en la cuenta que tenías. HivePulse solo recibe tu nombre y tu dirección, nunca una contraseña.',
          'Zaloguj się kontem Apple lub Google zamiast hasłem. Z tym samym adresem e-mail trafisz na istniejące konto. HivePulse otrzymuje tylko twoje imię i adres, nigdy hasło.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'Deleting an account that was made with Apple also withdraws HivePulse’s access at Apple.',
          'Wer ein mit Apple angelegtes Konto löscht, entzieht HivePulse auch den Zugriff bei Apple.',
          'Supprimer un compte créé avec Apple retire aussi l’accès de HivePulse chez Apple.',
          'Al eliminar una cuenta creada con Apple también se retira el acceso de HivePulse en Apple.',
          'Usunięcie konta założonego przez Apple wycofuje też dostęp HivePulse w Apple.',
        ),
      },
    ],
  },
  {
    date: '2026-09-17',
    title: t(
      'September 2026: a lighter look, words and taps in the inspection form, crash reports',
      'September 2026: ein helleres Aussehen, Wörter und Tippen im Kontrollformular, Absturzberichte',
      'Septembre 2026 : un aspect plus clair, des mots et des touches dans le formulaire de visite, rapports de plantage',
      'Septiembre 2026: un aspecto más claro, palabras y toques en el formulario de revisión, informes de fallos',
      'Wrzesień 2026: jaśniejszy wygląd, słowa i dotknięcia w formularzu przeglądu, raporty o awariach',
    ),
    items: [
      {
        kind: 'added',
        text: t(
          'A guided tour for new users in both apps, shown after the first sign-in and available again from Settings.',
          'Eine geführte Tour für neue Nutzer in beiden Apps, nach der ersten Anmeldung und danach jederzeit in den Einstellungen.',
          'Une visite guidée pour les nouveaux utilisateurs dans les deux applications, après la première connexion et ensuite dans les paramètres.',
          'Un recorrido guiado para nuevos usuarios en ambas apps, tras el primer inicio de sesión y después en los ajustes.',
          'Przewodnik dla nowych użytkowników w obu aplikacjach, pokazywany po pierwszym logowaniu i dostępny ponownie w Ustawieniach.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Crash reports from the apps and the server (EU region), so faults are found before anyone runs into them. No advertising, no tracking of what you do.',
          'Absturzberichte aus den Apps und vom Server (EU-Region), damit Fehler gefunden werden, bevor jemand hineinläuft. Keine Werbung, kein Verfolgen dessen, was du tust.',
          'Rapports de plantage des applications et du serveur (région UE), pour trouver les défauts avant que quiconque les rencontre. Pas de publicité, pas de suivi de ce que vous faites.',
          'Informes de fallos de las apps y del servidor (región UE), para encontrar los fallos antes de que nadie se tope con ellos. Sin publicidad y sin rastrear lo que haces.',
          'Raporty o awariach z aplikacji i serwera (region UE), aby usterki były znajdowane, zanim ktokolwiek na nie trafi. Bez reklam, bez śledzenia tego, co robisz.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'The website has a lighter, calmer look; the Android app is amber again everywhere.',
          'Die Webseite wirkt heller und ruhiger; die Android-App ist überall wieder bernsteinfarben.',
          'Le site a un aspect plus clair et plus calme ; l’application Android retrouve son ambre partout.',
          'La web tiene un aspecto más claro y sereno; la app de Android vuelve a ser ámbar en todas partes.',
          'Serwis ma jaśniejszy, spokojniejszy wygląd; aplikacja na Androida znów jest wszędzie bursztynowa.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'Words instead of numbers in the inspection form (colony strength, temper), and frame counts with a tap on the number: made for gloves.',
          'Wörter statt Zahlen im Kontrollformular (Volksstärke, Stimmung) und Waben zählen mit einem Tipp auf die Zahl: gemacht für Handschuhe.',
          'Des mots plutôt que des chiffres dans le formulaire de visite (force de la colonie, humeur) et le comptage des cadres d’un toucher sur le chiffre : pensé pour les gants.',
          'Palabras en lugar de números en el formulario de revisión (fuerza de la colonia, ánimo) y contar cuadros con un toque en el número: pensado para guantes.',
          'Słowa zamiast liczb w formularzu przeglądu (siła rodziny, temperament) i liczba ramek jednym dotknięciem: stworzone do pracy w rękawicach.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'An apiary can be made public on the community map later, and the news appear in your language.',
          'Ein Bienenstand lässt sich nachträglich auf der Community-Karte öffentlich machen, und die News erscheinen in deiner Sprache.',
          'Un rucher peut être rendu public sur la carte de la communauté après coup, et les actualités s’affichent dans votre langue.',
          'Un colmenar se puede hacer público en el mapa de la comunidad más tarde, y las noticias aparecen en tu idioma.',
          'Pasiekę można później udostępnić na mapie społeczności, a aktualności pojawiają się w twoim języku.',
        ),
      },
    ],
  },
];

/** The full list of what HivePulse can do. */
export const FEATURES: FeatureGroup[] = [
  {
    id: 'apiaries',
    title: t('Apiaries and hives', 'Bienenstände und Völker', 'Ruchers et ruches', 'Colmenares y colmenas', 'Pasieki i rodziny'),
    items: [
      t(
        'Apiaries with name, address or GPS position, description and an optional place on the public community map.',
        'Bienenstände mit Name, Adresse oder GPS-Position, Beschreibung und auf Wunsch einem Platz auf der öffentlichen Community-Karte.',
        'Ruchers avec nom, adresse ou position GPS, description et, au choix, une place sur la carte publique de la communauté.',
        'Colmenares con nombre, dirección o posición GPS, descripción y, si quieres, un lugar en el mapa público de la comunidad.',
        'Pasieki z nazwą, adresem lub pozycją GPS, opisem i opcjonalnym miejscem na publicznej mapie społeczności.',
      ),
      t(
        'Hives with a type (Langstroth, Dadant, Top Bar, Warré, other), acquisition date and notes.',
        'Völker mit Beutentyp (Langstroth, Dadant, Top Bar, Warré, anderer), Anschaffungsdatum und Notizen.',
        'Ruches avec un type (Langstroth, Dadant, Top Bar, Warré, autre), date d’acquisition et notes.',
        'Colmenas con un tipo (Langstroth, Dadant, Top Bar, Warré, otro), fecha de adquisición y notas.',
        'Rodziny z typem ula (Langstroth, Dadant, Top Bar, Warré, inny), datą nabycia i notatkami.',
      ),
      t(
        'Custom fields for hives and inspections, for your whole account or for a single apiary.',
        'Eigene Felder für Völker und Kontrollen, für das ganze Konto oder für einen einzelnen Bienenstand.',
        'Champs personnalisés pour les ruches et les visites, pour tout le compte ou pour un seul rucher.',
        'Campos propios para colmenas y revisiones, para toda la cuenta o para un solo colmenar.',
        'Własne pola dla rodzin i przeglądów, dla całego konta lub pojedynczej pasieki.',
      ),
    ],
  },
  {
    id: 'qr',
    title: t('QR codes', 'QR-Codes', 'QR codes', 'Códigos QR', 'Kody QR'),
    items: [
      t(
        'Generate batches of QR codes in advance and print them as a PDF.',
        'QR-Codes als Batch vorab erzeugen und als PDF drucken.',
        'Générer des lots de QR codes à l’avance et les imprimer en PDF.',
        'Generar lotes de códigos QR por adelantado e imprimirlos en PDF.',
        'Generuj partie kodów QR z wyprzedzeniem i drukuj je jako PDF.',
      ),
      t(
        'Scan a sticker to open the hive at once; the first scan of a new code sets the hive up.',
        'Aufkleber scannen und das Volk sofort öffnen; der erste Scan eines neuen Codes richtet das Volk ein.',
        'Scanner un autocollant pour ouvrir la ruche aussitôt ; le premier scan d’un nouveau code crée la ruche.',
        'Escanear una pegatina para abrir la colmena al instante; el primer escaneo de un código nuevo crea la colmena.',
        'Zeskanuj naklejkę, aby od razu otworzyć rodzinę; pierwsze skanowanie nowego kodu zakłada rodzinę.',
      ),
      t(
        'Delete batches that no hive uses.',
        'Batches löschen, die kein Volk benutzt.',
        'Supprimer les lots qu’aucune ruche n’utilise.',
        'Eliminar los lotes que ninguna colmena usa.',
        'Usuwaj partie, których żadna rodzina nie używa.',
      ),
    ],
  },
  {
    id: 'inspections',
    title: t('Inspections', 'Kontrollen', 'Visites', 'Revisiones', 'Przeglądy'),
    items: [
      t(
        'Record varroa, temper, queen, brood and honey frames, weight, treatments applied and notes for every visit.',
        'Varroa, Stimmung, Königin, Brut- und Honigwaben, Gewicht, angewendete Behandlungen und Notizen bei jeder Kontrolle erfassen.',
        'Noter varroa, humeur, reine, cadres de couvain et de miel, poids, traitements appliqués et notes à chaque visite.',
        'Anotar varroa, ánimo, reina, cuadros de cría y de miel, peso, tratamientos aplicados y notas en cada revisión.',
        'Zapisuj przy każdej wizycie Varroa, temperament, matkę, ramki z czerwiem i miodem, wagę, zastosowane zabiegi i notatki.',
      ),
      t(
        'Made for gloves: big buttons, words instead of numbers, frame counts with one tap.',
        'Gemacht für Handschuhe: große Knöpfe, Wörter statt Zahlen, Waben mit einem Tipp zählen.',
        'Pensé pour les gants : grands boutons, des mots plutôt que des chiffres, cadres comptés d’un toucher.',
        'Pensado para guantes: botones grandes, palabras en lugar de números, cuadros contados con un toque.',
        'Stworzone do pracy w rękawicach: duże przyciski, słowa zamiast liczb, liczba ramek jednym dotknięciem.',
      ),
      t(
        'Works without a connection in the apps: visits are kept on the phone and uploaded when the signal returns.',
        'Funktioniert in den Apps ohne Verbindung: Kontrollen bleiben auf dem Telefon und werden hochgeladen, sobald wieder Empfang ist.',
        'Fonctionne sans connexion dans les applications : les visites restent sur le téléphone et sont envoyées au retour du réseau.',
        'Funciona sin conexión en las apps: las revisiones se guardan en el teléfono y se suben cuando vuelve la señal.',
        'W aplikacjach działa bez połączenia: wizyty są zapisywane na telefonie i przesyłane, gdy wróci zasięg.',
      ),
    ],
  },
  {
    id: 'home',
    title: t('Home screen, treatments and reminders', 'Startseite, Behandlungen und Erinnerungen', 'Accueil, traitements et rappels', 'Inicio, tratamientos y recordatorios', 'Ekran główny, zabiegi i przypomnienia'),
    items: [
      t(
        'Home screen: the next inspection, the state of all hives (fine, to watch, alert, unknown, with the reason) and upcoming treatments.',
        'Startseite: die nächste Kontrolle, der Zustand aller Völker (in Ordnung, beobachten, Alarm, unbekannt, mit Grund) und anstehende Behandlungen.',
        'Accueil : la prochaine visite, l’état de toutes les ruches (en ordre, à surveiller, alerte, inconnu, avec la raison) et les traitements à venir.',
        'Inicio: la próxima revisión, el estado de todas las colmenas (bien, a vigilar, alerta, desconocido, con el motivo) y los tratamientos próximos.',
        'Ekran główny: następny przegląd, stan wszystkich rodzin (w porządku, do obserwacji, alarm, nieznany, z powodem) i nadchodzące zabiegi.',
      ),
      t(
        'Plan treatments for a hive or a whole apiary and tick them off.',
        'Behandlungen für ein Volk oder einen ganzen Bienenstand planen und abhaken.',
        'Planifier des traitements pour une ruche ou tout un rucher et les cocher.',
        'Planificar tratamientos para una colmena o un colmenar entero y marcarlos.',
        'Planuj zabiegi dla rodziny lub całej pasieki i odhaczaj je.',
      ),
      t(
        'Inspection reminders with your own interval and season.',
        'Kontrollerinnerungen mit eigenem Intervall und eigener Saison.',
        'Rappels de visites avec votre propre intervalle et votre propre saison.',
        'Recordatorios de revisión con tu propio intervalo y tu propia temporada.',
        'Przypomnienia o przeglądach z własnym odstępem i sezonem.',
      ),
    ],
  },
  {
    id: 'year',
    title: t('The beekeeping year', 'Das Imkerjahr', 'L’année apicole', 'El año apícola', 'Rok pszczelarski'),
    items: [
      t(
        'An endless timeline of what to do when: feeding, inspections, swarm control, drone frames, moving and extracting for each kind of honey, varroa treatment and preparing for winter.',
        'Ein endloser Zeitstrahl dessen, was wann zu tun ist: Füttern, Kontrollen, Schwarmkontrolle, Drohnenrahmen, Verlagern und Schleudern für jede Honigsorte, Varroabehandlung und Vorbereitung auf den Winter.',
        'Une frise sans fin de ce qu’il y a à faire et quand : nourrissement, visites, contrôle de l’essaimage, cadres à mâles, déplacements et extraction pour chaque miel, traitement contre le varroa et préparation de l’hiver.',
        'Una línea del tiempo interminable de qué hacer y cuándo: alimentación, revisiones, control de la enjambrazón, cuadros de zánganos, traslados y extracción para cada miel, tratamiento contra la varroa y preparación del invierno.',
        'Niekończąca się oś czasu tego, co robić i kiedy: karmienie, przeglądy, kontrola rójki, ramki trutowe, przewóz i miodobranie dla każdego rodzaju miodu, zabieg przeciw Varroa i przygotowanie do zimy.',
      ),
      t(
        'Moved to your place by country and postal code, adjustable by hand, in English, German, French, Spanish and Polish.',
        'Auf deinen Ort verschoben nach Land und Postleitzahl, von Hand anpassbar, auf Deutsch, Englisch, Französisch, Spanisch und Polnisch.',
        'Décalée pour votre lieu selon le pays et le code postal, ajustable à la main, en allemand, anglais, français, espagnol et polonais.',
        'Adaptada a tu lugar por país y código postal, ajustable a mano, en alemán, inglés, francés, español y polaco.',
        'Dopasowany do twojego miejsca przez kraj i kod pocztowy, z ręczną korektą, po angielsku, niemiecku, francusku, hiszpańsku i polsku.',
      ),
    ],
  },
  {
    id: 'moving',
    title: t('Moving hives', 'Völker verlagern', 'Déplacer des ruches', 'Trasladar colmenas', 'Przewożenie rodzin'),
    items: [
      t(
        'Move hives between your apiaries or to a new place, with day, forage (acacia, rapeseed, fir, heather and more) and note.',
        'Völker zwischen deinen Bienenständen oder an einen neuen Ort verlagern, mit Tag, Tracht (Akazie, Raps, Tanne, Heide und mehr) und Notiz.',
        'Déplacer des ruches entre vos ruchers ou vers un nouveau lieu, avec jour, miellée (acacia, colza, sapin, bruyère et plus) et note.',
        'Trasladar colmenas entre tus colmenares o a un lugar nuevo, con día, flora (acacia, colza, abeto, brezo y más) y nota.',
        'Przewoź rodziny między swoimi pasiekami lub w nowe miejsce, z dniem, pożytkiem (akacja, rzepak, jodła, wrzos i inne) i notatką.',
      ),
      t(
        'The history of where each hive has stood, and a map of every journey.',
        'Die Geschichte der Standorte jedes Volks und eine Wanderkarte mit jedem Weg.',
        'L’historique des emplacements de chaque ruche et une carte de chaque parcours.',
        'El historial de dónde ha estado cada colmena y un mapa de cada recorrido.',
        'Historia miejsc, w których stała każda rodzina, i mapa każdej podróży.',
      ),
      t(
        'A shortcut back to where the hives came from.',
        'Eine Schnellwahl zurück dorthin, wo die Völker herkamen.',
        'Un raccourci pour revenir d’où les ruches venaient.',
        'Un atajo para volver a donde estaban las colmenas.',
        'Skrót z powrotem tam, skąd rodziny przyjechały.',
      ),
    ],
  },
  {
    id: 'sharing',
    title: t('Working together', 'Zusammenarbeiten', 'Travailler ensemble', 'Trabajar juntos', 'Wspólna praca'),
    items: [
      t(
        'Invite another beekeeper by e-mail to an apiary or to single hives; both of you can look and change.',
        'Einen anderen Imker per E-Mail zu einem Bienenstand oder einzelnen Völkern einladen; ihr beide könnt ansehen und ändern.',
        'Inviter un autre apiculteur par e-mail sur un rucher ou sur quelques ruches ; vous pouvez tous deux consulter et modifier.',
        'Invitar por correo a otro apicultor a un colmenar o a colmenas sueltas; ambos podéis ver y cambiar.',
        'Zaproś innego pszczelarza e-mailem do pasieki lub do pojedynczych rodzin; oboje możecie przeglądać i zmieniać.',
      ),
      t(
        'Deleting, the public map, moving and inviting stay with the owner.',
        'Löschen, öffentliche Karte, Verlagern und Einladen bleiben beim Besitzer.',
        'Supprimer, la carte publique, déplacer et inviter restent au propriétaire.',
        'Eliminar, el mapa público, trasladar e invitar se quedan con el propietario.',
        'Usuwanie, mapa publiczna, przewożenie i zapraszanie zostają przy właścicielu.',
      ),
    ],
  },
  {
    id: 'stats',
    title: t('Statistics and data', 'Statistik und Daten', 'Statistiques et données', 'Estadísticas y datos', 'Statystyki i dane'),
    items: [
      t(
        'Charts per hive: varroa trend, temper, queen seen, brood frames and the time between inspections.',
        'Diagramme je Volk: Varroa-Verlauf, Stimmung, Königin gesehen, Brutwaben und der Abstand zwischen Kontrollen.',
        'Graphiques par ruche : évolution du varroa, humeur, reine vue, cadres de couvain et délai entre les visites.',
        'Gráficos por colmena: evolución de la varroa, ánimo, reina vista, cuadros de cría y el tiempo entre revisiones.',
        'Wykresy dla każdej rodziny: przebieg Varroa, temperament, widziana matka, ramki z czerwiem i odstęp między przeglądami.',
      ),
      t(
        'An overview of all your apiaries, and community statistics to compare yourself with.',
        'Eine Übersicht über alle deine Bienenstände und Community-Statistiken zum Vergleichen.',
        'Une vue d’ensemble de tous vos ruchers et des statistiques de la communauté pour vous comparer.',
        'Un resumen de todos tus colmenares y estadísticas de la comunidad para compararte.',
        'Przegląd wszystkich twoich pasiek i statystyki społeczności do porównania z własnymi.',
      ),
      t(
        'Export the inspections of an apiary as JSON or CSV.',
        'Die Kontrollen eines Bienenstands als JSON oder CSV exportieren.',
        'Exporter les visites d’un rucher en JSON ou CSV.',
        'Exportar las revisiones de un colmenar como JSON o CSV.',
        'Eksport przeglądów pasieki jako JSON lub CSV.',
      ),
    ],
  },
  {
    id: 'hornets',
    title: t('Hornet tracker', 'Hornissen-Tracker', 'Suivi des frelons', 'Rastreador de avispas', 'Tropiciel szerszeni'),
    items: [
      t(
        'Report Asian hornet catches and nests, with photos that the community votes on.',
        'Fänge und Nester der Asiatischen Hornisse melden, mit Fotos, über die die Community abstimmt.',
        'Signaler des captures et des nids de frelon asiatique, avec des photos soumises au vote de la communauté.',
        'Informar de capturas y nidos de avispón asiático, con fotos que vota la comunidad.',
        'Zgłaszaj odłowy i gniazda szerszenia azjatyckiego, ze zdjęciami, nad którymi głosuje społeczność.',
      ),
      t(
        'A live map of nests and traps, and named traps with an access code for daily catch counts.',
        'Eine Live-Karte von Nestern und Fallen und benannte Fallen mit Zugangscode für die täglichen Fangzahlen.',
        'Une carte en direct des nids et des pièges, et des pièges nommés avec un code d’accès pour les comptes quotidiens.',
        'Un mapa en vivo de nidos y trampas, y trampas con nombre y código de acceso para los recuentos diarios.',
        'Mapa gniazd i pułapek na żywo oraz nazwane pułapki z kodem dostępu do dziennych liczb odłowów.',
      ),
    ],
  },
  {
    id: 'account',
    title: t('Account and privacy', 'Konto und Datenschutz', 'Compte et confidentialité', 'Cuenta y privacidad', 'Konto i prywatność'),
    items: [
      t(
        'Sign in with e-mail, Apple or Google; five languages: English, German, French, Spanish and Polish.',
        'Anmelden mit E-Mail, Apple oder Google; fünf Sprachen: Englisch, Deutsch, Französisch, Spanisch und Polnisch.',
        'Connexion par e-mail, Apple ou Google ; cinq langues : anglais, allemand, français, espagnol et polonais.',
        'Inicio de sesión con correo, Apple o Google; cinco idiomas: inglés, alemán, francés, español y polaco.',
        'Logowanie e-mailem, przez Apple lub Google; pięć języków: angielski, niemiecki, francuski, hiszpański i polski.',
      ),
      t(
        'Delete your account and all your data yourself, at any time.',
        'Konto und alle Daten jederzeit selbst löschen.',
        'Supprimer vous-même votre compte et toutes vos données, à tout moment.',
        'Eliminar tú mismo tu cuenta y todos tus datos, en cualquier momento.',
        'Usuń konto i wszystkie swoje dane samodzielnie, w każdej chwili.',
      ),
      t(
        'No advertising network and no tracking of what you do.',
        'Kein Werbenetzwerk und kein Verfolgen dessen, was du tust.',
        'Pas de régie publicitaire et pas de suivi de ce que vous faites.',
        'Sin red publicitaria y sin rastrear lo que haces.',
        'Bez sieci reklamowej i bez śledzenia tego, co robisz.',
      ),
    ],
  },
  {
    id: 'platforms',
    title: t('Website and apps', 'Webseite und Apps', 'Site et applications', 'Web y apps', 'Serwis i aplikacje'),
    items: [
      t(
        'Website, iPhone app and Android app, with the same layout in both apps.',
        'Webseite, iPhone-App und Android-App, in beiden Apps gleich aufgebaut.',
        'Site, application iPhone et application Android, construites de la même façon dans les deux applications.',
        'Web, app de iPhone y app de Android, organizadas igual en ambas apps.',
        'Serwis, aplikacja na iPhone\'a i aplikacja na Androida, z tym samym układem w obu aplikacjach.',
      ),
      t(
        'A guided tour, help pages in five languages, news and these release notes.',
        'Eine geführte Tour, Hilfeseiten in fünf Sprachen, News und diese Release Notes.',
        'Une visite guidée, des pages d’aide en cinq langues, des actualités et ces notes de version.',
        'Un recorrido guiado, páginas de ayuda en cinco idiomas, noticias y estas notas de versión.',
        'Przewodnik, strony pomocy w pięciu językach, aktualności i te informacje o wersjach.',
      ),
    ],
  },
];
