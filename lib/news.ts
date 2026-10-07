// News feed entries, newest first. Every entry carries its text in all four site locales;
// app/[locale]/news/page.tsx picks the one matching the current locale.

export type NewsLocale = 'en' | 'de' | 'fr' | 'es';
export type NewsTag = 'feature' | 'fix' | 'design' | 'release' | 'privacy';

export interface NewsText {
  title: string;
  body: string;
}

export interface NewsEntry {
  /** ISO date, YYYY-MM-DD */
  date: string;
  tag: NewsTag;
  text: Record<NewsLocale, NewsText>;
}

export function newsText(entry: NewsEntry, locale: string): NewsText {
  return entry.text[locale as NewsLocale] ?? entry.text.en;
}

export const NEWS: NewsEntry[] = [
  {
    date: '2026-10-07',
    tag: 'feature',
    text: {
      en: {
        title: 'Your Day at a Glance, and Treatments You Can Plan',
        body: 'The start of the apiary list now tells you what matters: when the next inspection is due (counted from your reminder interval), how your hives are doing — fine, to watch, or alert, with the reason — and which treatments are coming up. You can plan a treatment for a single hive or for all hives of an apiary, with the product and the day, and tick it off when it is done. Once in a while the same spot can carry an announcement from us; there is no advertising network and nothing is tracked. The website has it now; the apps follow with their next versions.',
      },
      de: {
        title: 'Dein Tag im Überblick und Behandlungen, die du planen kannst',
        body: 'Der Anfang der Bienenstand-Liste zeigt dir jetzt, was wichtig ist: wann die nächste Kontrolle fällig ist (gerechnet aus deinem Erinnerungs-Intervall), wie es deinen Völkern geht — in Ordnung, beobachten oder Alarm, mit dem Grund — und welche Behandlungen anstehen. Du kannst eine Behandlung für ein einzelnes Volk oder für alle Völker eines Bienenstands planen, mit Mittel und Tag, und sie abhaken, wenn sie erledigt ist. Ab und zu kann an derselben Stelle eine Mitteilung von uns stehen; es gibt kein Werbenetzwerk und nichts wird verfolgt. Auf der Webseite gibt es das jetzt, die Apps folgen mit ihren nächsten Versionen.',
      },
      fr: {
        title: 'Votre journée en un coup d’œil, et des traitements à planifier',
        body: 'Le haut de la liste des ruchers vous dit maintenant ce qui compte : quand la prochaine visite est due (calculée d’après votre intervalle de rappel), comment vont vos ruches — en ordre, à surveiller ou en alerte, avec la raison — et quels traitements approchent. Vous pouvez planifier un traitement pour une seule ruche ou pour toutes les ruches d’un rucher, avec le produit et le jour, et le cocher une fois fait. De temps en temps, cet espace peut porter une annonce de notre part ; il n’y a pas de régie publicitaire et rien n’est suivi. Le site l’offre dès maintenant ; les applications suivent avec leurs prochaines versions.',
      },
      es: {
        title: 'Tu día de un vistazo y tratamientos que puedes planificar',
        body: 'El inicio de la lista de colmenares ahora te dice lo que importa: cuándo toca la próxima revisión (calculada con tu intervalo de recordatorio), cómo están tus colmenas — bien, a vigilar o en alerta, con el motivo — y qué tratamientos se acercan. Puedes planificar un tratamiento para una sola colmena o para todas las de un colmenar, con el producto y el día, y marcarlo cuando esté hecho. De vez en cuando ese mismo espacio puede llevar un anuncio nuestro; no hay red publicitaria y no se rastrea nada. La web ya lo tiene; las aplicaciones lo reciben con sus próximas versiones.',
      },
    },
  },
  {
    date: '2026-10-07',
    tag: 'feature',
    text: {
      en: {
        title: 'Taking Hives to the Bloom, and Seeing Where They Went',
        body: 'Migratory beekeepers can now move hives as one action: pick the hives, the new place (an existing apiary or a new one, with an address), the day and the forage, from acacia and rapeseed to fir and heather. Every move is kept. Each hive shows where it has stood, and a map of moves draws the journey of every hive, numbered stop by stop. Only the owner of an apiary can move its hives. The website has it now; the apps follow with their next versions.',
      },
      de: {
        title: 'Völker zur Blüte bringen und sehen, wo sie waren',
        body: 'Wanderimker können Völker jetzt in einem Schritt verlagern: Völker wählen, den neuen Ort (ein vorhandener Bienenstand oder ein neuer, mit Adresse), den Tag und die Tracht, von Akazie und Raps bis Tanne und Heide. Jede Verlagerung bleibt gespeichert. Jedes Volk zeigt, wo es gestanden hat, und die Wanderkarte zeichnet den Weg jedes Volks, Station für Station nummeriert. Verlagern darf nur der Besitzer eines Bienenstands. Auf der Webseite gibt es das jetzt, die Apps folgen mit ihren nächsten Versionen.',
      },
      fr: {
        title: 'Emmener les ruches à la floraison, et voir où elles sont passées',
        body: "Les apiculteurs transhumants peuvent désormais déplacer des ruches en une seule action : choisir les ruches, le nouveau lieu (un rucher existant ou un nouveau, avec une adresse), le jour et la miellée, de l'acacia et du colza au sapin et à la bruyère. Chaque déplacement est conservé. Chaque ruche montre où elle a été, et la carte des déplacements trace le parcours de chaque ruche, étape par étape. Seul le propriétaire d'un rucher peut en déplacer les ruches. Le site l'offre dès maintenant ; les applications suivent avec leurs prochaines versions.",
      },
      es: {
        title: 'Llevar las colmenas a la floración y ver dónde han estado',
        body: 'Los apicultores trashumantes ya pueden trasladar colmenas en un solo paso: elegir las colmenas, el nuevo lugar (un colmenar existente o uno nuevo, con dirección), el día y la floración, desde la acacia y la colza hasta el abeto y el brezo. Cada traslado queda guardado. Cada colmena muestra dónde ha estado, y el mapa de traslados dibuja el recorrido de cada una, parada por parada. Solo el propietario de un colmenar puede trasladar sus colmenas. La web ya lo tiene; las aplicaciones lo recibirán con sus próximas versiones.',
      },
    },
  },
  {
    date: '2026-10-06',
    tag: 'feature',
    text: {
      en: {
        title: 'Two Beekeepers, One Apiary',
        body: 'You can now invite another beekeeper to work on an apiary with you, or on single hives. Enter their email address, they accept, and they see what you share: they can record inspections, edit hives and see the figures, and everything they enter shows their name. Only you can delete, invite others or put the apiary on the public map. If you ever delete your account, an apiary you shared goes to the person who accepted first, so what you built together is not lost. Sharing is on the website now and comes to the apps with their next versions.',
      },
      de: {
        title: 'Zwei Imker, ein Bienenstand',
        body: 'Du kannst jetzt einen anderen Imker einladen, mit dir an einem Bienenstand zu arbeiten, oder auch nur an einzelnen Völkern. E-Mail-Adresse eingeben, die Person sagt zu, und sie sieht, was du teilst: Sie kann Kontrollen erfassen, Völker bearbeiten und die Zahlen sehen, und alles, was sie einträgt, trägt ihren Namen. Nur du kannst löschen, weitere Personen einladen oder den Bienenstand auf die öffentliche Karte setzen. Falls du dein Konto einmal löschst, geht ein geteilter Bienenstand an die Person, die zuerst zugesagt hat, damit nicht verloren geht, was ihr gemeinsam aufgebaut habt. Das Teilen gibt es jetzt auf der Webseite und kommt mit den nächsten Versionen in die Apps.',
      },
      fr: {
        title: 'Deux apiculteurs, un rucher',
        body: "Vous pouvez désormais inviter un autre apiculteur à travailler avec vous sur un rucher, ou seulement sur quelques ruches. Saisissez son adresse e-mail, la personne accepte et voit ce que vous partagez : elle peut saisir des visites, modifier les ruches et consulter les chiffres, et tout ce qu'elle saisit porte son nom. Vous seul pouvez supprimer, inviter d'autres personnes ou placer le rucher sur la carte publique. Si vous supprimez un jour votre compte, un rucher partagé revient à la personne qui a accepté en premier, afin que ce que vous avez construit ensemble ne soit pas perdu. Le partage est disponible sur le site et arrive dans les applications avec leurs prochaines versions.",
      },
      es: {
        title: 'Dos apicultores, un colmenar',
        body: 'Ahora puedes invitar a otro apicultor a trabajar contigo en un colmenar, o solo en algunas colmenas. Introduce su correo electrónico, la persona acepta y ve lo que compartes: puede anotar revisiones, editar colmenas y ver las cifras, y todo lo que anota lleva su nombre. Solo tú puedes eliminar, invitar a otras personas o poner el colmenar en el mapa público. Si algún día eliminas tu cuenta, un colmenar compartido pasa a la primera persona que aceptó, para que no se pierda lo que habéis construido juntos. Compartir ya está en la web y llegará a las aplicaciones con sus próximas versiones.',
      },
    },
  },
  {
    date: '2026-10-06',
    tag: 'feature',
    text: {
      en: {
        title: 'Delete QR Batches You Do Not Need',
        body: 'A batch of QR codes you generated by mistake, or never printed, can now be deleted on the website, and in the iPhone and Android apps with their next versions. A batch stays as long as one of its codes is stuck on a hive, because scanning that sticker is how the hive is found again.',
      },
      de: {
        title: 'QR-Batches löschen, die du nicht brauchst',
        body: 'Ein Batch QR-Codes, den du aus Versehen erzeugt oder nie gedruckt hast, lässt sich jetzt auf der Webseite löschen, und mit den nächsten Versionen auch in der iPhone- und der Android-App. Ein Batch bleibt, solange einer seiner Codes an einem Volk klebt, denn über diesen Aufkleber findest du das Volk beim Scannen wieder.',
      },
      fr: {
        title: 'Supprimer les lots de QR codes inutiles',
        body: "Un lot de QR codes généré par erreur, ou jamais imprimé, peut désormais être supprimé sur le site, et dans les applications iPhone et Android avec leurs prochaines versions. Un lot est conservé tant que l'un de ses codes est collé sur une ruche, car c'est en scannant cet autocollant que l'on retrouve la ruche.",
      },
      es: {
        title: 'Elimina los lotes de QR que no necesitas',
        body: 'Un lote de códigos QR generado por error, o que nunca imprimiste, ahora se puede eliminar en la web, y en las aplicaciones de iPhone y Android con sus próximas versiones. Un lote se conserva mientras uno de sus códigos esté pegado en una colmena, porque escaneando esa pegatina se vuelve a encontrar la colmena.',
      },
    },
  },
  {
    date: '2026-10-05',
    tag: 'feature',
    text: {
      en: {
        title: 'Sign In With Apple or Google, No Password to Remember',
        body: 'You can now sign in with your Apple or Google account, on the website and in the test versions of the apps: Apple on the iPhone and the website, Google on Android, the iPhone and the website. If your email address is the same, you land in the account you already had, with all your hives. The email form is still there, as a quiet link under the buttons. HivePulse only ever receives your name and address from them, never a password.',
      },
      de: {
        title: 'Mit Apple oder Google anmelden, ohne Passwort',
        body: 'Du kannst dich jetzt mit deinem Apple- oder Google-Konto anmelden, auf der Webseite und in den Testversionen der Apps: Apple auf dem iPhone und der Webseite, Google auf Android, dem iPhone und der Webseite. Ist die E-Mail-Adresse dieselbe, landest du in dem Konto, das du schon hattest, mit allen deinen Völkern. Das E-Mail-Formular gibt es weiterhin, als unauffälligen Link unter den Knöpfen. HivePulse erhält von dort nur deinen Namen und deine Adresse, nie ein Passwort.',
      },
      fr: {
        title: 'Se connecter avec Apple ou Google, sans mot de passe',
        body: "Vous pouvez désormais vous connecter avec votre compte Apple ou Google, sur le site et dans les versions de test des applications : Apple sur l'iPhone et le site, Google sur Android, l'iPhone et le site. Si l'adresse e-mail est la même, vous retrouvez le compte que vous aviez déjà, avec toutes vos ruches. Le formulaire e-mail existe toujours, en lien discret sous les boutons. HivePulse ne reçoit d'eux que votre nom et votre adresse, jamais un mot de passe.",
      },
      es: {
        title: 'Inicia sesión con Apple o Google, sin contraseña',
        body: 'Ahora puedes iniciar sesión con tu cuenta de Apple o de Google, en la web y en las versiones de prueba de las aplicaciones: Apple en el iPhone y en la web, Google en Android, el iPhone y la web. Si el correo electrónico es el mismo, entras en la cuenta que ya tenías, con todas tus colmenas. El formulario de correo sigue ahí, como un enlace discreto bajo los botones. HivePulse solo recibe de ellos tu nombre y tu dirección, nunca una contraseña.',
      },
    },
  },
  {
    date: '2026-10-04',
    tag: 'fix',
    text: {
      en: {
        title: 'A Fault Found Before Anyone Ran Into It',
        body: 'The server keeps a set of open lines to the database so it can answer quickly. Those lines were being closed from the other end during quiet spells, and the server did not notice — so the first request after a break could fail with an error, an apiary that simply would not load. Our own monitoring caught it in the test system before any beekeeper met it. The server now checks a line before it uses it and quietly opens a fresh one when needed. Nothing to do on your side.',
      },
      de: {
        title: 'Ein Fehler, gefunden bevor jemand hineinlief',
        body: 'Der Server hält offene Leitungen zur Datenbank, um schnell antworten zu können. Diese Leitungen wurden in ruhigen Zeiten von der anderen Seite geschlossen, ohne dass der Server es merkte — die erste Anfrage nach einer Pause konnte deshalb mit einer Fehlermeldung enden, ein Bienenstand, der einfach nicht lud. Unsere eigene Überwachung hat das im Testsystem gefunden, bevor ein Imker darauf gestoßen ist. Jetzt prüft der Server eine Leitung, bevor er sie benutzt, und baut bei Bedarf still eine neue auf. Zu tun ist nichts.',
      },
      fr: {
        title: "Une panne trouvée avant que personne ne la rencontre",
        body: "Le serveur garde des lignes ouvertes vers la base de données pour répondre vite. Ces lignes étaient fermées de l'autre côté pendant les périodes calmes, sans que le serveur s'en aperçoive : la première requête après une pause pouvait donc échouer avec une erreur, un rucher qui refusait tout simplement de charger. Notre propre surveillance l'a détectée dans le système de test avant qu'un apiculteur ne la rencontre. Le serveur vérifie désormais une ligne avant de s'en servir et en ouvre discrètement une nouvelle si besoin. Rien à faire de votre côté.",
      },
      es: {
        title: 'Un fallo encontrado antes de que nadie se topara con él',
        body: 'El servidor mantiene líneas abiertas hacia la base de datos para responder rápido. Esas líneas se cerraban desde el otro lado durante los ratos tranquilos, sin que el servidor se diera cuenta: la primera petición tras una pausa podía fallar con un error, un colmenar que simplemente no cargaba. Nuestra propia supervisión lo detectó en el sistema de pruebas antes de que ningún apicultor se topara con él. Ahora el servidor comprueba una línea antes de usarla y abre otra nueva sin hacer ruido cuando hace falta. No hay nada que hacer por tu parte.',
      },
    },
  },
  {
    date: '2026-10-02',
    tag: 'release',
    text: {
      en: {
        title: 'Twelve Beekeepers Needed Before the App May Be Published',
        body: 'HivePulse is finished, but not yet in the stores — and that is not for want of trying. Before Google lets a new developer publish an app, twelve people have to test it for fourteen consecutive days. So the test round is the gate, not a formality. If you keep bees and own an Android phone or an iPhone, you can get the app now and help it reach everybody else: there is a page explaining what it involves, what to report and what happens with your data. It takes a quarter of an hour to set up and one visit to the hives to be useful.',
      },
      de: {
        title: 'Zwölf Imker, damit die App überhaupt erscheinen darf',
        body: 'HivePulse ist fertig, aber noch nicht in den Stores — und das liegt nicht am Wollen. Bevor Google einen neuen Entwickler veröffentlichen lässt, müssen zwölf Leute die App vierzehn Tage lang hintereinander testen. Die Testrunde ist also die Hürde, keine Formsache. Wer Bienen hält und ein Android-Telefon oder iPhone hat, bekommt die App jetzt und hilft, dass sie bei allen anderen ankommt: Auf einer eigenen Seite steht, was dazugehört, was zu melden ist und was mit deinen Daten passiert. Das Einrichten dauert eine Viertelstunde, nützlich wird es bei einem Gang zu den Völkern.',
      },
      fr: {
        title: "Douze apiculteurs pour que l'application puisse paraître",
        body: "HivePulse est terminée, mais pas encore dans les boutiques — et ce n'est pas faute d'essayer. Avant que Google autorise un nouveau développeur à publier, douze personnes doivent tester l'application pendant quatorze jours consécutifs. La phase de test est donc la condition, pas une formalité. Si vous avez des ruches et un téléphone Android ou un iPhone, vous pouvez obtenir l'application dès maintenant et aider à ce qu'elle parvienne aux autres : une page explique ce que cela implique, quoi signaler et ce qu'il advient de vos données. Un quart d'heure pour l'installer, une visite aux ruches pour être utile.",
      },
      es: {
        title: 'Doce apicultores para que la aplicación pueda publicarse',
        body: 'HivePulse está terminada, pero todavía no está en las tiendas, y no por falta de ganas. Antes de que Google deje publicar a un desarrollador nuevo, doce personas tienen que probar la aplicación durante catorce días seguidos. La ronda de pruebas es, por tanto, la condición y no un trámite. Si tienes colmenas y un teléfono Android o un iPhone, puedes conseguir la aplicación ya y ayudar a que llegue a todos los demás: hay una página que explica qué implica, qué informar y qué pasa con tus datos. Un cuarto de hora para instalarla y una visita a las colmenas para resultar útil.',
      },
    },
  },
  {
    date: '2026-10-02',
    tag: 'privacy',
    text: {
      en: {
        title: 'The Site No Longer Tells Google You Were Here',
        body: 'The fonts used across the site were loaded from Google servers, which means every single page view handed your IP address to Google before a word was rendered. They are now delivered from our own servers, so nobody outside learns that you visited. One of the four fonts turned out to be loaded with five weights and used nowhere at all, so it is gone too — a little less to download on your first visit.',
      },
      de: {
        title: 'Die Seite verrät Google nicht mehr, dass du hier warst',
        body: 'Die Schriften der Seite wurden von Google-Servern geladen — bei jedem Seitenaufruf ging deine IP-Adresse also an Google, noch bevor ein Wort zu sehen war. Jetzt liefern wir sie von unseren eigenen Servern aus, damit niemand von außen erfährt, dass du hier warst. Eine der vier Schriften wurde übrigens in fünf Schnitten geladen und nirgends verwendet — die ist ebenfalls weg, das macht deinen ersten Besuch ein wenig schneller.',
      },
      fr: {
        title: 'Le site ne dit plus à Google que vous étiez là',
        body: "Les polices du site étaient chargées depuis des serveurs de Google : à chaque page consultée, votre adresse IP partait chez Google avant même qu'un mot soit affiché. Elles sont désormais servies depuis nos propres serveurs, si bien que personne à l'extérieur n'apprend votre visite. L'une des quatre polices était d'ailleurs chargée en cinq graisses sans être utilisée nulle part : elle a disparu aussi, ce qui allège votre première visite.",
      },
      es: {
        title: 'El sitio ya no le cuenta a Google que estuviste aquí',
        body: 'Las tipografías del sitio se cargaban desde servidores de Google: en cada visita tu dirección IP llegaba a Google antes de que se mostrara una sola palabra. Ahora las servimos desde nuestros propios servidores, así que nadie de fuera se entera de tu visita. Una de las cuatro tipografías, por cierto, se cargaba en cinco grosores y no se usaba en ningún sitio; también ha desaparecido, lo que aligera tu primera visita.',
      },
    },
  },
  {
    date: '2026-10-01',
    tag: 'privacy',
    text: {
      en: {
        title: 'Crashes No Longer Go Unnoticed',
        body: 'When an app closed itself in the middle of an inspection, nobody found out unless the beekeeper wrote in. Both apps and the server now send a report when something breaks: the place in the code, the app version and the kind of device. What they deliberately leave out is everything about you — no inspection notes, no passwords, no email addresses, no IP addresses, no screenshots. A report names your account number and nothing else, and it is stored in Europe. The reports go to Sentry, which processes them on our behalf.',
      },
      de: {
        title: 'Abstürze bleiben nicht mehr unbemerkt',
        body: 'Wenn sich eine App mitten in einer Kontrolle beendet hat, hat das niemand erfahren — außer der Imker hat geschrieben. Beide Apps und der Server melden jetzt, wenn etwas kaputtgeht: die Stelle im Code, die App-Version und die Art des Geräts. Bewusst nicht enthalten ist alles, was mit dir zu tun hat: keine Kontroll-Notizen, keine Passwörter, keine E-Mail-Adressen, keine IP-Adressen, keine Bildschirmfotos. Ein Bericht nennt deine Kontonummer und sonst nichts, und er wird in Europa gespeichert. Die Berichte gehen an Sentry, das sie in unserem Auftrag verarbeitet.',
      },
      fr: {
        title: 'Les plantages ne passent plus inaperçus',
        body: "Quand une application se fermait au milieu d'une visite, personne ne l'apprenait, sauf si l'apiculteur écrivait. Les deux applications et le serveur signalent désormais ce qui casse : l'endroit dans le code, la version de l'application et le type d'appareil. Ce qui en est délibérément absent, c'est tout ce qui vous concerne : aucune note de visite, aucun mot de passe, aucune adresse e-mail, aucune adresse IP, aucune capture d'écran. Un rapport indique votre numéro de compte et rien d'autre, et il est conservé en Europe. Les rapports vont à Sentry, qui les traite pour notre compte.",
      },
      es: {
        title: 'Los fallos ya no pasan desapercibidos',
        body: 'Cuando una app se cerraba en mitad de una revisión, nadie se enteraba salvo que el apicultor escribiera. Ahora ambas apps y el servidor avisan cuando algo se rompe: el punto del código, la versión de la app y el tipo de dispositivo. Queda fuera a propósito todo lo que tiene que ver contigo: ninguna nota de revisión, ninguna contraseña, ninguna dirección de correo, ninguna dirección IP, ninguna captura de pantalla. Un informe indica tu número de cuenta y nada más, y se guarda en Europa. Los informes van a Sentry, que los procesa por encargo nuestro.',
      },
    },
  },
  {
    date: '2026-09-20',
    tag: 'feature',
    text: {
      en: {
        title: 'Frame Counts With Gloves On: Tap the Number',
        body: 'Brood and honey frames were entered with a plus and a minus button — on the iPhone those were the tiny system arrows, barely usable with gloves, and picking eight frames meant eight taps. Both apps now show every value from 0 to 10 as its own large button across the full width of the form. One tap sets the number, tapping it again clears it. The buttons are 60 points tall on the iPhone and 68dp on Android, comfortably above what a gloved finger needs.',
      },
      de: {
        title: 'Waben zählen mit Handschuhen: einfach die Zahl antippen',
        body: 'Brut- und Honigwaben hast du bisher mit einem Plus- und einem Minus-Knopf eingegeben — auf dem iPhone waren das die winzigen System-Pfeile, mit Handschuhen kaum zu treffen, und für acht Waben brauchte es acht Tipper. Beide Apps zeigen jetzt jeden Wert von 0 bis 10 als eigenen großen Knopf über die volle Breite des Formulars. Ein Tipp setzt die Zahl, ein zweiter löscht sie wieder. Die Knöpfe sind auf dem iPhone 60 Punkt und auf Android 68dp hoch, also deutlich größer als das, was ein Finger im Handschuh braucht.',
      },
      fr: {
        title: 'Compter les cadres avec des gants : touchez le chiffre',
        body: "Les cadres de couvain et de miel se saisissaient avec un bouton plus et un bouton moins — sur iPhone, c'étaient les minuscules flèches du système, presque impossibles à viser avec des gants, et huit cadres demandaient huit appuis. Les deux applications affichent désormais chaque valeur de 0 à 10 comme un grand bouton sur toute la largeur du formulaire. Un appui choisit le chiffre, un second l'efface. Les boutons font 60 points de haut sur iPhone et 68dp sur Android, bien au-delà de ce qu'exige un doigt ganté.",
      },
      es: {
        title: 'Contar cuadros con guantes: toca el número',
        body: 'Los cuadros de cría y de miel se introducían con un botón de más y otro de menos; en el iPhone eran las diminutas flechas del sistema, casi imposibles de acertar con guantes, y ocho cuadros exigían ocho toques. Ahora ambas apps muestran cada valor de 0 a 10 como un botón grande a lo ancho del formulario. Un toque fija el número y otro lo borra. Los botones miden 60 puntos de alto en el iPhone y 68dp en Android, muy por encima de lo que necesita un dedo con guante.',
      },
    },
  },
  {
    date: '2026-09-18',
    tag: 'design',
    text: {
      en: {
        title: 'The Android App Is Amber Again, Everywhere',
        body: 'Buttons and cards in the Android app showed Android\'s default lilac in a few places — the plus and minus buttons for brood and honey frames, and the statistics card — because the app never told the system which colours to use for those surfaces. They now follow the HivePulse amber and stone palette like everything else. The apiary list and the QR batch list also leave room at the bottom, so the last entry is no longer hidden behind the round button.',
      },
      de: {
        title: 'Die Android-App ist überall wieder bernsteinfarben',
        body: 'An ein paar Stellen zeigte die Android-App das Standard-Lila von Android: bei den Plus- und Minus-Knöpfen für Brut- und Honigwaben und bei der Statistik-Karte. Die App hatte dem System für diese Flächen nie eigene Farben genannt. Jetzt folgen sie wie alles andere dem Bernstein-Stein-Farbschema von HivePulse. In der Bienenstandsliste und der QR-Stapel-Liste ist unten außerdem Platz gelassen, sodass der letzte Eintrag nicht mehr hinter dem runden Knopf verschwindet.',
      },
      fr: {
        title: 'L\'application Android retrouve son ambre partout',
        body: "À quelques endroits, l'application Android affichait le lilas par défaut d'Android : les boutons plus et moins des cadres de couvain et de miel, ainsi que la carte des statistiques. L'application n'avait jamais indiqué au système quelles couleurs utiliser pour ces surfaces. Elles suivent désormais la palette ambre et pierre de HivePulse comme le reste. La liste des ruchers et celle des lots de QR codes laissent aussi de la place en bas, si bien que la dernière entrée n'est plus cachée derrière le bouton rond.",
      },
      es: {
        title: 'La app de Android vuelve a ser ámbar en todas partes',
        body: 'En algunos puntos la app de Android mostraba el lila predeterminado de Android: los botones de más y menos de los cuadros de cría y miel, y la tarjeta de estadísticas. La app nunca le había indicado al sistema qué colores usar en esas superficies. Ahora siguen la paleta ámbar y piedra de HivePulse como todo lo demás. La lista de colmenares y la de lotes de QR también dejan espacio abajo, así que la última entrada ya no queda oculta tras el botón redondo.',
      },
    },
  },
  {
    date: '2026-09-17',
    tag: 'fix',
    text: {
      en: {
        title: 'Make an Apiary Public Later, and News in Your Language',
        body: 'An apiary could only be put on the public map when you first created it — in the iPhone app not even then, and editing an apiary on the iPhone quietly discarded your changes. Both apps now let you edit an apiary at any time, including the "Show on public map" switch, and your changes are saved. Only public apiaries appear on the community map and count towards its figures. On the website, news posts now appear in your language, the Asian hornet photo in the hornet tracker is back, and the top navigation no longer cuts off the download button with longer German or French labels.',
      },
      de: {
        title: 'Bienenstand nachträglich öffentlich machen, und News in deiner Sprache',
        body: 'Einen Bienenstand konntest du bisher nur beim Anlegen auf die öffentliche Karte bringen — in der iPhone-App nicht einmal dann, und Änderungen an einem Bienenstand gingen auf dem iPhone stillschweigend verloren. In beiden Apps kannst du einen Bienenstand jetzt jederzeit bearbeiten, auch den Schalter „Auf öffentlicher Karte anzeigen“, und die Änderungen werden gespeichert. Nur öffentliche Bienenstände erscheinen auf der Gemeinschaftskarte und zählen in ihren Zahlen mit. Auf der Website erscheinen die News jetzt in deiner Sprache, das Foto der Asiatischen Hornisse im Hornissentracker ist zurück, und die obere Navigation schneidet den Download-Knopf bei längeren deutschen oder französischen Texten nicht mehr ab.',
      },
      fr: {
        title: 'Rendre un rucher public après coup, et les actualités dans votre langue',
        body: "Un rucher ne pouvait être placé sur la carte publique qu'au moment de sa création — et pas même alors dans l'application iPhone, où les modifications d'un rucher étaient perdues sans prévenir. Les deux applications permettent désormais de modifier un rucher à tout moment, y compris l'option « Afficher sur la carte publique », et vos changements sont enregistrés. Seuls les ruchers publics apparaissent sur la carte communautaire et comptent dans ses chiffres. Sur le site, les actualités s'affichent maintenant dans votre langue, la photo du frelon asiatique est de retour dans le suivi des frelons, et la navigation en haut de page ne coupe plus le bouton de téléchargement avec des libellés allemands ou français plus longs.",
      },
      es: {
        title: 'Haz público un colmenar más tarde, y noticias en tu idioma',
        body: 'Hasta ahora un colmenar solo podía aparecer en el mapa público si lo marcabas al crearlo, y en la app de iPhone ni siquiera entonces; además, los cambios en un colmenar se perdían sin aviso en el iPhone. Ambas apps permiten ahora editar un colmenar en cualquier momento, incluido el interruptor «Mostrar en el mapa público», y los cambios se guardan. Solo los colmenares públicos aparecen en el mapa de la comunidad y cuentan en sus cifras. En la web, las noticias se muestran ya en tu idioma, la foto del avispón asiático ha vuelto al rastreador de avispones y la navegación superior ya no corta el botón de descarga con textos más largos en alemán o francés.',
      },
    },
  },
  {
    date: '2026-09-17',
    tag: 'feature',
    text: {
      en: {
        title: 'Words Instead of Numbers When You Inspect',
        body: "Recording an inspection at the hive is now quicker. Colony strength is a simple choice of weak, medium or strong, and varroa is recorded as none, low, medium or high instead of a mite count — both in the iOS and Android apps and on the website. Your earlier entries were converted automatically. The queen colour is picked by tapping a coloured dot. And you can finally edit a hive's name, type, acquisition date and notes directly in the apps, not only on the website. Strong colonies now save correctly in the Android app as well.",
      },
      de: {
        title: 'Worte statt Zahlen bei der Durchsicht',
        body: 'Eine Durchsicht am Volk ist jetzt schneller erfasst. Die Volksstärke wählst du einfach als schwach, mittel oder stark, und Varroa trägst du als keine, schwach, mittel oder stark ein statt als Milbenzahl — in der iOS- und Android-App ebenso wie auf der Website. Deine bisherigen Einträge wurden automatisch umgerechnet. Die Königinnenfarbe wählst du mit einem Tipp auf einen Farbpunkt. Und Name, Beutentyp, Anschaffungsdatum und Notizen eines Volks lassen sich jetzt direkt in den Apps bearbeiten, nicht mehr nur auf der Website. Starke Völker werden außerdem in der Android-App wieder korrekt gespeichert.',
      },
      fr: {
        title: 'Des mots plutôt que des chiffres lors de la visite',
        body: "Saisir une visite au rucher est désormais plus rapide. La force de la colonie se choisit simplement entre faible, moyenne ou forte, et le varroa s'indique comme nul, faible, moyen ou élevé au lieu d'un nombre d'acariens — dans les applications iOS et Android comme sur le site. Vos saisies précédentes ont été converties automatiquement. La couleur de la reine se choisit d'un simple toucher sur une pastille de couleur. Et vous pouvez enfin modifier le nom, le type, la date d'acquisition et les notes d'une ruche directement dans les applications, et plus seulement sur le site. Les colonies fortes sont aussi de nouveau correctement enregistrées dans l'application Android.",
      },
      es: {
        title: 'Palabras en lugar de números al inspeccionar',
        body: 'Registrar una inspección en la colmena ahora es más rápido. La fuerza de la colonia se elige simplemente entre débil, media o fuerte, y la varroa se anota como ninguna, baja, media o alta en lugar de un recuento de ácaros, tanto en las apps de iOS y Android como en la web. Tus registros anteriores se convirtieron automáticamente. El color de la reina se elige tocando un punto de color. Y por fin puedes editar el nombre, el tipo, la fecha de adquisición y las notas de una colmena directamente en las apps, no solo en la web. Además, las colonias fuertes vuelven a guardarse correctamente en la app de Android.',
      },
    },
  },
  {
    date: '2026-09-17',
    tag: 'design',
    text: {
      en: {
        title: 'A Lighter, Calmer HivePulse',
        body: 'The website has a new look. The heavy dark green gave way to white and warm grey surfaces, and colour now signals what you are looking at: green for your apiaries and colonies, amber for notices, red for colony health and the hornet tracker, and blue-grey for statistics and help. The dashboard sidebar is light, figures are set in a clear monospaced font, and buttons are bigger and easier to hit. The HivePulse wordmark is rounder too. Nothing moved and every feature works exactly as before — it is simply easier on the eyes.',
      },
      de: {
        title: 'Ein helleres, ruhigeres HivePulse',
        body: 'Die Website hat ein neues Gesicht. Das schwere Dunkelgrün ist hellen Flächen in Weiß und warmem Grau gewichen, und Farbe zeigt jetzt, worum es geht: Grün für deine Bienenstände und Völker, Bernstein für Hinweise, Rot für Völkergesundheit und den Hornissentracker, Blaugrau für Statistik und Hilfe. Die Seitenleiste im Dashboard ist hell, Zahlen stehen in einer klaren Festbreitenschrift, und Schaltflächen sind größer und leichter zu treffen. Auch der HivePulse-Schriftzug ist runder geworden. Es ist nichts verschoben und alles funktioniert wie bisher — es ist einfach angenehmer fürs Auge.',
      },
      fr: {
        title: 'Un HivePulse plus clair et plus apaisé',
        body: "Le site fait peau neuve. Le vert foncé pesant laisse place à des surfaces blanches et gris chaud, et la couleur indique désormais ce que vous regardez : vert pour vos ruchers et colonies, ambre pour les avis, rouge pour la santé des colonies et le suivi des frelons, bleu-gris pour les statistiques et l'aide. La barre latérale du tableau de bord est claire, les chiffres sont affichés dans une police à chasse fixe lisible, et les boutons sont plus grands et plus faciles à toucher. Le logotype HivePulse est aussi plus arrondi. Rien n'a bougé et chaque fonction marche comme avant — c'est simplement plus reposant pour les yeux.",
      },
      es: {
        title: 'Un HivePulse más luminoso y sereno',
        body: 'La web tiene un nuevo aspecto. El verde oscuro y pesado deja paso a superficies blancas y gris cálido, y el color indica ahora lo que estás viendo: verde para tus colmenares y colonias, ámbar para avisos, rojo para la salud de las colonias y el rastreador de avispones, y gris azulado para estadísticas y ayuda. La barra lateral del panel es clara, las cifras usan una tipografía monoespaciada nítida y los botones son más grandes y fáciles de pulsar. El logotipo de HivePulse también es más redondeado. Nada ha cambiado de sitio y todo funciona igual que antes: simplemente resulta más agradable a la vista.',
      },
    },
  },
  {
    date: '2026-09-16',
    tag: 'fix',
    text: {
      en: {
        title: 'Readable Numbers and Proper Translations in the Inspection Form',
        body: 'Logging an inspection on the iPhone showed only a plus and a minus for brood frames, honey frames and colony strength — the number itself was missing, so you could not see what you were setting. The number is back. The colony mood, queen colour and colony strength options also appeared in English no matter which language you used; they are now translated in German, French, Spanish and English in both apps. Hive weight is no longer a bare text box either: it keeps the keyboard for exact values and adds plus and minus buttons in half-kilo steps, for gloved hands at the hive. On the website, the mood chart legend was showing English labels too, and now follows your language.',
      },
      de: {
        title: 'Lesbare Zahlen und richtige Übersetzungen im Durchsichtsformular',
        body: 'Beim Erfassen einer Durchsicht auf dem iPhone waren bei Brutwaben, Honigwaben und Volksstärke nur Plus und Minus zu sehen — die Zahl selbst fehlte, man sah also nicht, was man einstellte. Die Zahl ist wieder da. Auch Stimmung, Königinnenfarbe und Volksstärke erschienen unabhängig von der Sprache auf Englisch; sie sind jetzt in beiden Apps auf Deutsch, Französisch, Spanisch und Englisch übersetzt. Das Gewicht ist außerdem kein nacktes Textfeld mehr: Die Tastatur für genaue Werte bleibt, dazu kommen Plus- und Minus-Knöpfe in Halbkilo-Schritten, praktisch mit Handschuhen am Volk. Auf der Website zeigte die Legende des Stimmungsdiagramms ebenfalls englische Bezeichnungen und folgt jetzt deiner Sprache.',
      },
      fr: {
        title: 'Des chiffres lisibles et de vraies traductions dans le formulaire de visite',
        body: "En saisissant une visite sur iPhone, seuls un plus et un moins s'affichaient pour les cadres de couvain, les cadres de miel et la force de la colonie — le chiffre lui-même manquait, on ne voyait donc pas la valeur choisie. Le chiffre est de retour. Les options d'humeur, de couleur de la reine et de force de la colonie apparaissaient aussi en anglais quelle que soit la langue ; elles sont maintenant traduites en allemand, français, espagnol et anglais dans les deux applications. Le poids de la ruche n'est plus un simple champ de texte : le clavier reste disponible pour les valeurs exactes, avec en plus des boutons plus et moins par pas d'un demi-kilo, pratiques avec des gants. Sur le site, la légende du graphique d'humeur affichait aussi des libellés anglais et suit désormais votre langue.",
      },
      es: {
        title: 'Números legibles y traducciones correctas en el formulario de inspección',
        body: 'Al registrar una inspección en el iPhone solo se veían un más y un menos para los cuadros de cría, los cuadros de miel y la fuerza de la colonia: faltaba el número, así que no se veía qué valor se estaba poniendo. El número ha vuelto. Las opciones de estado de ánimo, color de la reina y fuerza de la colonia también aparecían en inglés sin importar el idioma; ahora están traducidas al alemán, francés, español e inglés en ambas apps. El peso de la colmena ya no es un simple cuadro de texto: conserva el teclado para valores exactos y añade botones de más y menos en pasos de medio kilo, cómodos con guantes. En la web, la leyenda del gráfico de ánimo también mostraba etiquetas en inglés y ahora sigue tu idioma.',
      },
    },
  },
  {
    date: '2026-09-15',
    tag: 'fix',
    text: {
      en: {
        title: 'Members Page Loads Instantly Again',
        body: 'The community box on the Members page waited for the global statistics before showing anything — and those statistics were being calculated with a separate database query for every apiary and hive, which took several seconds as the community grew. The server now gathers them in just a few queries, and the log-in or supporter prompt appears immediately while the numbers fill in.',
      },
      de: {
        title: 'Die Mitgliederseite lädt wieder sofort',
        body: 'Der Gemeinschaftsbereich auf der Mitgliederseite hat auf die globalen Statistiken gewartet, bevor er überhaupt etwas zeigte — und diese wurden mit einer eigenen Datenbankabfrage für jeden Bienenstand und jedes Volk berechnet, was mit wachsender Gemeinschaft mehrere Sekunden dauerte. Der Server holt sie jetzt mit wenigen Abfragen, und der Hinweis zum Anmelden oder Unterstützen erscheint sofort, während die Zahlen nachladen.',
      },
      fr: {
        title: 'La page Membres se charge de nouveau instantanément',
        body: "L'encart communautaire de la page Membres attendait les statistiques globales avant d'afficher quoi que ce soit — et ces statistiques étaient calculées avec une requête distincte pour chaque rucher et chaque ruche, ce qui prenait plusieurs secondes à mesure que la communauté grandissait. Le serveur les rassemble désormais en quelques requêtes, et l'invitation à se connecter ou à devenir soutien apparaît immédiatement pendant que les chiffres se chargent.",
      },
      es: {
        title: 'La página de Miembros vuelve a cargar al instante',
        body: 'El recuadro de la comunidad en la página de Miembros esperaba a las estadísticas globales antes de mostrar nada, y esas estadísticas se calculaban con una consulta a la base de datos por cada colmenar y cada colmena, lo que tardaba varios segundos a medida que crecía la comunidad. Ahora el servidor las reúne con unas pocas consultas, y la invitación a iniciar sesión o hacerse colaborador aparece de inmediato mientras se cargan las cifras.',
      },
    },
  },
  {
    date: '2026-09-15',
    tag: 'feature',
    text: {
      en: {
        title: 'A Guided Tour for New Users in Both Apps',
        body: 'The first time you sign in to the iOS or Android app, a short swipeable tour now introduces what HivePulse can do for you — QR codes on every hive, quick inspections, statistics, reminders and the hornet tracker. Skip it any time, and bring it back later from Settings with "Show guided tour again".',
      },
      de: {
        title: 'Eine geführte Tour für neue Nutzer in beiden Apps',
        body: 'Wenn du dich zum ersten Mal in der iOS- oder Android-App anmeldest, stellt dir jetzt eine kurze Tour zum Durchwischen vor, was HivePulse für dich kann — QR-Codes an jedem Volk, schnelle Durchsichten, Statistiken, Erinnerungen und den Hornissentracker. Du kannst sie jederzeit überspringen und später in den Einstellungen mit „Tour erneut anzeigen“ zurückholen.',
      },
      fr: {
        title: 'Une visite guidée pour les nouveaux utilisateurs dans les deux applications',
        body: "À votre première connexion à l'application iOS ou Android, une courte visite à faire défiler présente désormais ce que HivePulse peut faire pour vous — des QR codes sur chaque ruche, des visites rapides, des statistiques, des rappels et le suivi des frelons. Passez-la quand vous voulez et relancez-la plus tard depuis les Réglages avec « Revoir la visite guidée ».",
      },
      es: {
        title: 'Un recorrido guiado para nuevos usuarios en ambas apps',
        body: 'La primera vez que inicias sesión en la app de iOS o Android, un breve recorrido deslizable te presenta lo que HivePulse puede hacer por ti: códigos QR en cada colmena, inspecciones rápidas, estadísticas, recordatorios y el rastreador de avispones. Puedes saltarlo cuando quieras y volver a verlo desde Ajustes con «Mostrar de nuevo el recorrido».',
      },
    },
  },
  {
    date: '2026-09-15',
    tag: 'feature',
    text: {
      en: {
        title: 'The iOS App Gets the New HivePulse Look and Catches Up with Web and Android',
        body: 'The iPhone app now uses the same amber-and-stone design and DM Sans typeface as the website. It also gained everything the Android app received recently: printable QR code PDFs that open right away, email reminders, the account-wide statistics overview, password reset links, managing your custom fields for all apiaries or just one, and — for supporters — the regional health map in the Members tab.',
      },
      de: {
        title: 'Die iOS-App bekommt den neuen HivePulse-Look und holt zu Web und Android auf',
        body: 'Die iPhone-App nutzt jetzt dasselbe Design in Bernstein und Steingrau und dieselbe Schrift DM Sans wie die Website. Außerdem hat sie alles bekommen, was die Android-App zuletzt erhalten hat: druckbare QR-Code-PDFs, die sich sofort öffnen, E-Mail-Erinnerungen, die kontoweite Statistikübersicht, Links zum Zurücksetzen des Passworts, die Verwaltung eigener Felder für alle oder einzelne Bienenstände und — für Unterstützer — die regionale Gesundheitskarte im Mitglieder-Tab.',
      },
      fr: {
        title: "L'application iOS adopte le nouveau style HivePulse et rattrape le web et Android",
        body: "L'application iPhone utilise désormais le même design ambre et pierre et la même police DM Sans que le site. Elle a aussi reçu tout ce que l'application Android a obtenu récemment : des PDF de QR codes imprimables qui s'ouvrent immédiatement, les rappels par e-mail, la vue d'ensemble des statistiques du compte, les liens de réinitialisation du mot de passe, la gestion de vos champs personnalisés pour tous les ruchers ou un seul et — pour les soutiens — la carte régionale de santé dans l'onglet Membres.",
      },
      es: {
        title: 'La app de iOS estrena el nuevo aspecto de HivePulse y se pone al día con la web y Android',
        body: 'La app de iPhone usa ahora el mismo diseño en ámbar y piedra y la misma tipografía DM Sans que la web. Además incorpora todo lo que la app de Android recibió hace poco: PDF de códigos QR imprimibles que se abren al instante, recordatorios por correo electrónico, el resumen de estadísticas de toda la cuenta, enlaces para restablecer la contraseña, la gestión de tus campos personalizados para todos los colmenares o solo uno y, para los colaboradores, el mapa regional de salud en la pestaña Miembros.',
      },
    },
  },
  {
    date: '2026-09-15',
    tag: 'fix',
    text: {
      en: {
        title: 'QR Code PDF Download Fixed in the Android App',
        body: 'Tapping Download PDF on a QR batch in the Android app did nothing — the download was handed off outside the app and failed silently once your session had been open for a while. The app now downloads the printable PDF itself, saves it to your Downloads folder and opens it right away — and tapping again no longer piles up duplicate copies.',
      },
      de: {
        title: 'QR-Code-PDF-Download in der Android-App repariert',
        body: 'Ein Tipp auf „PDF herunterladen“ bei einem QR-Stapel in der Android-App bewirkte nichts — der Download wurde außerhalb der App gestartet und scheiterte unbemerkt, sobald deine Sitzung eine Weile offen war. Die App lädt das druckbare PDF jetzt selbst herunter, speichert es in deinem Download-Ordner und öffnet es sofort — und erneutes Tippen erzeugt keine doppelten Kopien mehr.',
      },
      fr: {
        title: "Téléchargement du PDF de QR codes réparé dans l'application Android",
        body: "Toucher Télécharger le PDF sur un lot de QR codes dans l'application Android ne faisait rien — le téléchargement était confié à l'extérieur de l'application et échouait sans bruit dès que votre session était ouverte depuis un moment. L'application télécharge maintenant elle-même le PDF imprimable, l'enregistre dans votre dossier Téléchargements et l'ouvre aussitôt — et toucher à nouveau ne crée plus de copies en double.",
      },
      es: {
        title: 'Arreglada la descarga del PDF de códigos QR en la app de Android',
        body: 'Pulsar Descargar PDF en un lote de QR en la app de Android no hacía nada: la descarga se delegaba fuera de la app y fallaba sin avisar cuando la sesión llevaba un rato abierta. Ahora la app descarga el PDF imprimible por sí misma, lo guarda en tu carpeta de Descargas y lo abre enseguida, y volver a pulsar ya no acumula copias duplicadas.',
      },
    },
  },
  {
    date: '2026-09-14',
    tag: 'feature',
    text: {
      en: {
        title: 'Statistics Overview and Community Health Map Come to Android',
        body: 'The Android app now has the same account-wide statistics page as the web dashboard — apiaries, hives and inspections at a glance, broken down per apiary for any time window. Supporters also get the regional health map in the Members tab, with the same varroa, mood, swarm and brood overlays as on the web.',
      },
      de: {
        title: 'Statistikübersicht und Gesundheitskarte der Gemeinschaft jetzt auch auf Android',
        body: 'Die Android-App hat jetzt dieselbe kontoweite Statistikseite wie das Web-Dashboard — Bienenstände, Völker und Durchsichten auf einen Blick, für jeden Zeitraum nach Bienenstand aufgeschlüsselt. Unterstützer bekommen außerdem die regionale Gesundheitskarte im Mitglieder-Tab, mit denselben Ebenen für Varroa, Stimmung, Schwarmzellen und Brut wie im Web.',
      },
      fr: {
        title: 'La vue des statistiques et la carte de santé communautaire arrivent sur Android',
        body: "L'application Android dispose maintenant de la même page de statistiques du compte que le tableau de bord web — ruchers, ruches et visites en un coup d'œil, détaillés par rucher pour n'importe quelle période. Les soutiens obtiennent aussi la carte régionale de santé dans l'onglet Membres, avec les mêmes calques varroa, humeur, essaimage et couvain que sur le web.",
      },
      es: {
        title: 'El resumen de estadísticas y el mapa de salud de la comunidad llegan a Android',
        body: 'La app de Android tiene ahora la misma página de estadísticas de toda la cuenta que el panel web: colmenares, colmenas e inspecciones de un vistazo, desglosados por colmenar para cualquier periodo. Los colaboradores también tienen el mapa regional de salud en la pestaña Miembros, con las mismas capas de varroa, ánimo, enjambrazón y cría que en la web.',
      },
    },
  },
  {
    date: '2026-09-14',
    tag: 'feature',
    text: {
      en: {
        title: 'Custom Fields, Email Reminders and Password Resets Right in the Android App',
        body: 'A few things could previously only be done on the website. In the Android app you can now create, edit and delete your custom fields — for all apiaries or just one — turn on email reminders alongside push notifications, and request a password reset link without leaving the app.',
      },
      de: {
        title: 'Eigene Felder, E-Mail-Erinnerungen und Passwort-Reset direkt in der Android-App',
        body: 'Einiges ging bisher nur auf der Website. In der Android-App kannst du jetzt eigene Felder anlegen, bearbeiten und löschen — für alle Bienenstände oder nur einen —, E-Mail-Erinnerungen zusätzlich zu Push-Benachrichtigungen einschalten und einen Link zum Zurücksetzen des Passworts anfordern, ohne die App zu verlassen.',
      },
      fr: {
        title: "Champs personnalisés, rappels par e-mail et réinitialisation du mot de passe dans l'application Android",
        body: "Certaines actions n'étaient jusqu'ici possibles que sur le site. Dans l'application Android, vous pouvez désormais créer, modifier et supprimer vos champs personnalisés — pour tous les ruchers ou un seul —, activer les rappels par e-mail en plus des notifications push et demander un lien de réinitialisation du mot de passe sans quitter l'application.",
      },
      es: {
        title: 'Campos personalizados, recordatorios por correo y restablecimiento de contraseña en la app de Android',
        body: 'Algunas cosas solo se podían hacer en la web. En la app de Android ya puedes crear, editar y eliminar tus campos personalizados, para todos los colmenares o solo uno, activar recordatorios por correo además de las notificaciones push y pedir un enlace para restablecer la contraseña sin salir de la app.',
      },
    },
  },
  {
    date: '2026-07-20',
    tag: 'fix',
    text: {
      en: {
        title: 'Dashboard Navigation Now Works on Mobile',
        body: 'The dashboard sidebar was hiding its entire navigation on small screens with nothing to replace it, leaving mobile visitors with no way to reach anything but a logout button. A new menu toggle now reveals your apiaries, stats, profile, and every other page from your phone.',
      },
      de: {
        title: 'Die Dashboard-Navigation funktioniert jetzt auch auf dem Handy',
        body: 'Die Seitenleiste des Dashboards blendete auf kleinen Bildschirmen die gesamte Navigation aus, ohne Ersatz — mobil erreichte man nichts außer dem Abmelden-Knopf. Ein neuer Menü-Schalter zeigt dir jetzt auch auf dem Handy deine Bienenstände, Statistiken, dein Profil und alle anderen Seiten.',
      },
      fr: {
        title: 'La navigation du tableau de bord fonctionne désormais sur mobile',
        body: "Sur les petits écrans, la barre latérale du tableau de bord masquait toute la navigation sans rien pour la remplacer, si bien que les visiteurs mobiles ne pouvaient accéder qu'au bouton de déconnexion. Un nouveau bouton de menu affiche maintenant vos ruchers, statistiques, profil et toutes les autres pages depuis votre téléphone.",
      },
      es: {
        title: 'La navegación del panel ya funciona en el móvil',
        body: 'En pantallas pequeñas, la barra lateral del panel ocultaba toda la navegación sin nada que la sustituyera, así que desde el móvil solo se podía llegar al botón de cerrar sesión. Un nuevo botón de menú muestra ahora tus colmenares, estadísticas, perfil y todas las demás páginas desde el teléfono.',
      },
    },
  },
  {
    date: '2026-07-20',
    tag: 'feature',
    text: {
      en: {
        title: 'Inspection Reminders Now Also Available by Email',
        body: 'Push notifications only ever reached the iOS and Android apps, leaving web-only beekeepers with no way to be reminded of an overdue inspection. You can now opt in to email reminders from your profile page — independently of push, so you can enable either, both, or neither.',
      },
      de: {
        title: 'Erinnerungen an Durchsichten jetzt auch per E-Mail',
        body: 'Push-Benachrichtigungen erreichten nur die iOS- und Android-App, Imker, die nur die Website nutzen, wurden also nie an eine überfällige Durchsicht erinnert. Du kannst E-Mail-Erinnerungen jetzt auf deiner Profilseite einschalten — unabhängig von Push, also eines von beiden, beides oder keines.',
      },
      fr: {
        title: 'Les rappels de visite sont aussi disponibles par e-mail',
        body: "Les notifications push n'atteignaient que les applications iOS et Android, et les apiculteurs utilisant uniquement le site n'étaient jamais prévenus d'une visite en retard. Vous pouvez désormais activer les rappels par e-mail depuis votre page de profil — indépendamment des notifications push, pour activer l'un, l'autre, les deux ou aucun.",
      },
      es: {
        title: 'Los recordatorios de inspección ya también llegan por correo',
        body: 'Las notificaciones push solo llegaban a las apps de iOS y Android, así que quien usaba solo la web nunca recibía aviso de una inspección atrasada. Ahora puedes activar los recordatorios por correo desde tu página de perfil, de forma independiente a las notificaciones push: uno, otro, ambos o ninguno.',
      },
    },
  },
  {
    date: '2026-07-16',
    tag: 'fix',
    text: {
      en: {
        title: 'Public Map Pins Fixed for Address-Only Apiaries',
        body: 'Public apiaries created through the web dashboard only ever collected a free-text address, never GPS coordinates — so they were counted in the community totals but never rendered as a pin on the live map. The backend now automatically resolves a saved address into coordinates, so every public apiary with an address shows up on the map going forward.',
      },
      de: {
        title: 'Kartenmarkierungen für Bienenstände mit reiner Adresse repariert',
        body: 'Öffentliche Bienenstände, die im Web-Dashboard angelegt wurden, hatten nur eine Freitext-Adresse und nie GPS-Koordinaten — sie zählten zwar in den Gemeinschaftszahlen, erschienen aber nie als Markierung auf der Live-Karte. Der Server wandelt eine gespeicherte Adresse jetzt automatisch in Koordinaten um, sodass jeder öffentliche Bienenstand mit Adresse künftig auf der Karte erscheint.',
      },
      fr: {
        title: 'Épingles de la carte publique réparées pour les ruchers avec adresse seule',
        body: "Les ruchers publics créés depuis le tableau de bord web n'enregistraient qu'une adresse en texte libre, jamais de coordonnées GPS — ils comptaient dans les totaux de la communauté mais n'apparaissaient jamais comme épingle sur la carte en direct. Le serveur convertit désormais automatiquement une adresse enregistrée en coordonnées, si bien que chaque rucher public avec une adresse apparaît dorénavant sur la carte.",
      },
      es: {
        title: 'Arreglados los marcadores del mapa público para colmenares con solo dirección',
        body: 'Los colmenares públicos creados desde el panel web solo guardaban una dirección en texto libre, nunca coordenadas GPS, así que contaban en los totales de la comunidad pero nunca aparecían como marcador en el mapa en vivo. Ahora el servidor convierte automáticamente la dirección guardada en coordenadas, de modo que todo colmenar público con dirección aparece en el mapa a partir de ahora.',
      },
    },
  },
  {
    date: '2026-06-03',
    tag: 'feature',
    text: {
      en: {
        title: "Forgot Your Password? We've Got You Covered",
        body: 'A full forgot-password / reset-password flow is now live across the web dashboard, iOS, and Android — request a reset link by email, set a new password, and all of your existing sessions are automatically signed out for safety.',
      },
      de: {
        title: 'Passwort vergessen? Kein Problem',
        body: 'Passwort vergessen und zurücksetzen funktioniert jetzt vollständig im Web-Dashboard, auf iOS und auf Android — fordere einen Link per E-Mail an, lege ein neues Passwort fest, und alle bestehenden Sitzungen werden zur Sicherheit automatisch abgemeldet.',
      },
      fr: {
        title: 'Mot de passe oublié ? Pas de souci',
        body: "Le parcours complet « mot de passe oublié / réinitialisation » est disponible sur le tableau de bord web, iOS et Android — demandez un lien par e-mail, choisissez un nouveau mot de passe, et toutes vos sessions ouvertes sont automatiquement déconnectées par sécurité.",
      },
      es: {
        title: '¿Olvidaste tu contraseña? Te ayudamos',
        body: 'Ya está disponible el proceso completo para recuperar y restablecer la contraseña en el panel web, iOS y Android: pide un enlace por correo, elige una contraseña nueva y todas tus sesiones abiertas se cierran automáticamente por seguridad.',
      },
    },
  },
  {
    date: '2026-05-17',
    tag: 'feature',
    text: {
      en: {
        title: 'Custom Inspection Fields — Log What Matters to You',
        body: 'Every beekeeper tracks different things. Custom field definitions let you add your own inspection data points at the apiary or per-hive level, with support for text, number, boolean, date, and select-type fields — now available in the web dashboard, iOS, and Android.',
      },
      de: {
        title: 'Eigene Durchsichtsfelder — erfasse, was dir wichtig ist',
        body: 'Jeder Imker achtet auf andere Dinge. Mit eigenen Felddefinitionen fügst du Durchsichten zusätzliche Datenpunkte hinzu, für einen ganzen Bienenstand oder einzelne Völker, als Text, Zahl, Ja/Nein, Datum oder Auswahl — jetzt im Web-Dashboard, auf iOS und auf Android.',
      },
      fr: {
        title: 'Champs de visite personnalisés — notez ce qui compte pour vous',
        body: "Chaque apiculteur suit des choses différentes. Les définitions de champs personnalisés vous permettent d'ajouter vos propres données de visite au niveau du rucher ou de chaque ruche, sous forme de texte, nombre, oui/non, date ou liste de choix — désormais disponibles sur le tableau de bord web, iOS et Android.",
      },
      es: {
        title: 'Campos de inspección personalizados: registra lo que te importa',
        body: 'Cada apicultor sigue cosas distintas. Las definiciones de campos personalizados te permiten añadir tus propios datos de inspección a nivel de colmenar o de colmena, con campos de texto, número, sí/no, fecha y selección, ya disponibles en el panel web, iOS y Android.',
      },
    },
  },
  {
    date: '2026-05-14',
    tag: 'release',
    text: {
      en: {
        title: 'Web Dashboard Launches — Manage Your Hives from Any Browser',
        body: 'You no longer need the mobile app to check in on your bees. The new browser dashboard covers login, your apiary list, hive detail with varroa charts, QR batch management, and personal statistics — all from a desktop or laptop.',
      },
      de: {
        title: 'Das Web-Dashboard ist da — verwalte deine Völker in jedem Browser',
        body: 'Du brauchst die Handy-App nicht mehr, um nach deinen Bienen zu sehen. Das neue Browser-Dashboard bietet Anmeldung, deine Bienenstandsliste, Volksdetails mit Varroa-Diagrammen, die Verwaltung von QR-Stapeln und persönliche Statistiken — alles vom Desktop oder Laptop aus.',
      },
      fr: {
        title: 'Lancement du tableau de bord web — gérez vos ruches depuis n’importe quel navigateur',
        body: "Plus besoin de l'application mobile pour prendre des nouvelles de vos abeilles. Le nouveau tableau de bord dans le navigateur propose la connexion, la liste de vos ruchers, le détail des ruches avec graphiques varroa, la gestion des lots de QR codes et vos statistiques personnelles — le tout depuis un ordinateur.",
      },
      es: {
        title: 'Llega el panel web: gestiona tus colmenas desde cualquier navegador',
        body: 'Ya no necesitas la app móvil para ver cómo están tus abejas. El nuevo panel en el navegador incluye inicio de sesión, tu lista de colmenares, el detalle de cada colmena con gráficos de varroa, la gestión de lotes de QR y estadísticas personales, todo desde un ordenador de sobremesa o portátil.',
      },
    },
  },
  {
    date: '2026-05-13',
    tag: 'feature',
    text: {
      en: {
        title: 'Regional Varroa Heatmaps on the Public Map',
        body: 'The public live map now overlays a varroa-density heatmap — mite pressure aggregated across public apiaries in ~50 km grid cells, colour-coded green to red, so beekeepers can spot regional risk trends at a glance.',
      },
      de: {
        title: 'Regionale Varroa-Heatmaps auf der öffentlichen Karte',
        body: 'Die öffentliche Live-Karte zeigt jetzt eine Varroa-Heatmap — der Milbendruck öffentlicher Bienenstände wird in Rasterzellen von etwa 50 km zusammengefasst und von Grün bis Rot eingefärbt, sodass Imker regionale Risikotrends auf einen Blick erkennen.',
      },
      fr: {
        title: 'Cartes de chaleur régionales du varroa sur la carte publique',
        body: "La carte publique en direct superpose désormais une carte de chaleur du varroa — la pression des acariens des ruchers publics est agrégée en mailles d'environ 50 km, colorées du vert au rouge, pour repérer d'un coup d'œil les tendances de risque régionales.",
      },
      es: {
        title: 'Mapas de calor regionales de varroa en el mapa público',
        body: 'El mapa público en vivo muestra ahora un mapa de calor de varroa: la presión de ácaros de los colmenares públicos se agrupa en celdas de unos 50 km, coloreadas de verde a rojo, para que los apicultores detecten de un vistazo las tendencias de riesgo regionales.',
      },
    },
  },
  {
    date: '2026-05-12',
    tag: 'privacy',
    text: {
      en: {
        title: 'Apiary Locations Now Shown at City Level, Not Exact GPS',
        body: "To protect beekeepers from potential hive theft, the public map and community pages now show the nearest city or village centroid instead of an apiary's exact coordinates. You still see your own exact location when logged in — only the public-facing view is fuzzed.",
      },
      de: {
        title: 'Standorte von Bienenständen jetzt auf Ortsebene statt exakter GPS-Position',
        body: 'Zum Schutz vor Diebstahl von Völkern zeigen die öffentliche Karte und die Gemeinschaftsseiten jetzt den Mittelpunkt der nächsten Stadt oder des nächsten Dorfs statt der genauen Koordinaten eines Bienenstands. Angemeldet siehst du deinen eigenen Standort weiterhin exakt — nur die öffentliche Ansicht ist unscharf.',
      },
      fr: {
        title: 'Emplacement des ruchers affiché à l’échelle de la commune, et non au GPS près',
        body: "Pour protéger les apiculteurs contre le vol de ruches, la carte publique et les pages communautaires affichent désormais le centre de la ville ou du village le plus proche au lieu des coordonnées exactes d'un rucher. Une fois connecté, vous voyez toujours votre propre emplacement exact — seule la vue publique est floutée.",
      },
      es: {
        title: 'La ubicación de los colmenares se muestra a nivel de localidad, no con GPS exacto',
        body: 'Para proteger a los apicultores frente a posibles robos de colmenas, el mapa público y las páginas de la comunidad muestran ahora el centro de la ciudad o pueblo más cercano en lugar de las coordenadas exactas del colmenar. Con la sesión iniciada sigues viendo tu ubicación exacta; solo la vista pública está difuminada.',
      },
    },
  },
];
