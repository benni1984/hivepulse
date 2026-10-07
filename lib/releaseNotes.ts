// Release notes and the full list of features. Every text carries all four site locales; the page
// (app/[locale]/release-notes/page.tsx) picks the one matching the current locale. The apps open this
// page from Settings, so what is written here is what beekeepers read on every platform.

export type ReleaseLocale = 'en' | 'de' | 'fr' | 'es';
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

function t(en: string, de: string, fr: string, es: string): Localized {
  return { en, de, fr, es };
}

export function pick(text: Localized, locale: string): string {
  return text[locale as ReleaseLocale] ?? text.en;
}

/** Newest first. */
export const RELEASES: Release[] = [
  {
    date: '2026-10-07',
    title: t(
      'Home screen, treatments, moving hives and working together',
      'Startseite, Behandlungen, Verlagern und Zusammenarbeiten',
      'Accueil, traitements, déplacements et travail à plusieurs',
      'Inicio, tratamientos, traslados y trabajo en equipo',
    ),
    items: [
      {
        kind: 'added',
        text: t(
          'Home screen at the top of the apiary list: the next inspection, the state of the hives and upcoming treatments, and now and then an announcement card. No advertising network, no tracking.',
          'Startseite oben in der Bienenstand-Liste: die nächste Kontrolle, der Zustand der Völker und anstehende Behandlungen, und ab und zu eine Mitteilung. Kein Werbenetzwerk, kein Tracking.',
          'Accueil en haut de la liste des ruchers : la prochaine visite, l’état des ruches et les traitements à venir, et de temps en temps une annonce. Pas de régie publicitaire, pas de suivi.',
          'Inicio al principio de la lista de colmenares: la próxima revisión, el estado de las colmenas y los tratamientos próximos, y de vez en cuando un anuncio. Sin red publicitaria y sin rastreo.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Planned treatments for a hive or for all hives of an apiary, with product, day and note. Mark them done, reopen or delete them.',
          'Geplante Behandlungen für ein Volk oder alle Völker eines Bienenstands, mit Mittel, Tag und Notiz. Erledigen, wieder öffnen oder löschen.',
          'Traitements planifiés pour une ruche ou toutes les ruches d’un rucher, avec produit, jour et note. Les marquer comme faits, les rouvrir ou les supprimer.',
          'Tratamientos planificados para una colmena o todas las de un colmenar, con producto, día y nota. Marcarlos como hechos, reabrirlos o eliminarlos.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Moving hives between your apiaries, with day, forage and note. Each hive keeps the history of where it has stood, a map draws every journey, and a shortcut sends hives back to where they came from.',
          'Völker zwischen deinen Bienenständen verlagern, mit Tag, Tracht und Notiz. Jedes Volk behält die Geschichte seiner Standorte, eine Karte zeichnet jeden Weg, und eine Schnellwahl schickt Völker dorthin zurück, wo sie herkamen.',
          'Déplacer des ruches entre vos ruchers, avec jour, miellée et note. Chaque ruche garde l’historique de ses emplacements, une carte dessine chaque parcours et un raccourci les renvoie d’où elles venaient.',
          'Trasladar colmenas entre tus colmenares, con día, flora y nota. Cada colmena conserva el historial de dónde ha estado, un mapa dibuja cada recorrido y un atajo las devuelve a donde estaban.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Working together: invite another beekeeper by e-mail to an apiary or to single hives. Invitations are accepted in the app, on the website or through the link in the e-mail.',
          'Zusammenarbeiten: Lade einen anderen Imker per E-Mail zu einem Bienenstand oder einzelnen Völkern ein. Einladungen nimmst du in der App, auf der Webseite oder über den Link in der E-Mail an.',
          'Travailler ensemble : invitez un autre apiculteur par e-mail sur un rucher ou sur quelques ruches. Les invitations s’acceptent dans l’application, sur le site ou par le lien de l’e-mail.',
          'Trabajar juntos: invita por correo a otro apicultor a un colmenar o a colmenas sueltas. Las invitaciones se aceptan en la app, en la web o con el enlace del correo.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'A hive can now be made by hand in both apps: the amber New Hive button on the apiary page, no printed sticker needed. The sticker can still be used to open and set up a hive.',
          'Ein Volk lässt sich jetzt in beiden Apps von Hand anlegen: der bernsteinfarbene Knopf „Neues Volk“ auf der Seite des Bienenstands, ohne gedruckten Aufkleber. Der Aufkleber lässt sich weiter zum Öffnen und Einrichten nutzen.',
          'Une ruche peut maintenant être créée à la main dans les deux applications : le bouton ambre « Nouvelle ruche » sur la page du rucher, sans autocollant imprimé. L’autocollant reste utilisable pour ouvrir et configurer une ruche.',
          'Ahora se puede crear una colmena a mano en ambas apps: el botón ámbar «Nueva colmena» en la página del colmenar, sin pegatina impresa. La pegatina sigue sirviendo para abrir y configurar una colmena.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'The beekeeping year: an endless timeline of what to do when, month by month. Feeding with candy in February, the first inspections, swarm control at least every 9 days, drone frames against varroa, when to move for which honey and when to extract it, and the preparation for winter. Set your country and postal code and the dates move to your place.',
          'Das Imkerjahr: ein endloser Zeitstrahl dessen, was wann zu tun ist, Monat für Monat. Im Februar mit Futterteig füttern, die ersten Kontrollen, Schwarmkontrolle spätestens alle 9 Tage, Drohnenrahmen gegen Varroa, wann für welchen Honig zu verlagern und wann er zu schleudern ist, und die Vorbereitung auf den Winter. Lege Land und Postleitzahl fest, und die Termine verschieben sich auf deinen Ort.',
          'L’année apicole : une frise sans fin de ce qu’il y a à faire et quand, mois par mois. Nourrir au candi en février, les premières visites, le contrôle de l’essaimage au moins tous les 9 jours, les cadres à mâles contre le varroa, quand déplacer pour quel miel et quand l’extraire, et la préparation de l’hiver. Indiquez le pays et le code postal et les dates se décalent pour votre lieu.',
          'El año apícola: una línea del tiempo interminable de qué hacer y cuándo, mes a mes. Alimentar con candy en febrero, las primeras revisiones, el control de la enjambrazón como mínimo cada 9 días, los cuadros de zánganos contra la varroa, cuándo trasladar para qué miel y cuándo extraerla, y la preparación del invierno. Indica el país y el código postal y las fechas se adaptan a tu lugar.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Delete QR batches that no hive uses.',
          'QR-Batches löschen, die kein Volk benutzt.',
          'Supprimer les lots de QR codes qu’aucune ruche n’utilise.',
          'Eliminar los lotes de QR que ninguna colmena usa.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Release notes with the full list of features, and help pages for working together, moving hives, the home screen and treatments.',
          'Release Notes mit der vollständigen Funktionsliste und Hilfeseiten zu Zusammenarbeiten, Verlagern, Startseite und Behandlungen.',
          'Notes de version avec la liste complète des fonctions, et des pages d’aide sur le travail à plusieurs, les déplacements, l’accueil et les traitements.',
          'Notas de versión con la lista completa de funciones, y páginas de ayuda sobre trabajo en equipo, traslados, inicio y tratamientos.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'The Android and iPhone apps now have the same layout: tabs Apiaries, Scan, Hornets, Members and Settings; the same toolbar icons in the same order; the amber create button at the bottom right on every screen; settings in the same order.',
          'Die Apps für Android und iPhone sind jetzt gleich aufgebaut: Reiter Bienenstände, Scannen, Hornissen, Mitglieder und Einstellungen; dieselben Symbole in derselben Reihenfolge; auf jedem Bildschirm der bernsteinfarbene Anlegen-Knopf unten rechts; die Einstellungen in derselben Reihenfolge.',
          'Les applications Android et iPhone sont maintenant construites de la même façon : onglets Ruchers, Scanner, Frelons, Membres et Paramètres ; les mêmes icônes dans le même ordre ; le bouton ambre de création en bas à droite sur chaque écran ; les paramètres dans le même ordre.',
          'Las apps de Android y iPhone ahora están organizadas igual: pestañas Colmenares, Escanear, Avispas, Miembros y Ajustes; los mismos iconos en el mismo orden; el botón ámbar de crear abajo a la derecha en cada pantalla; los ajustes en el mismo orden.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'The same words on every surface: apiary, hive and inspection are called the same in the website, both apps and the e-mails, in every language.',
          'Dieselben Wörter überall: Bienenstand, Volk und Kontrolle heißen auf der Webseite, in beiden Apps und in den E-Mails gleich, in jeder Sprache.',
          'Les mêmes mots partout : rucher, ruche et visite s’appellent pareil sur le site, dans les deux applications et dans les e-mails, dans chaque langue.',
          'Las mismas palabras en todas partes: colmenar, colmena y revisión se llaman igual en la web, en ambas apps y en los correos, en cada idioma.',
        ),
      },
      {
        kind: 'fixed',
        text: t(
          'The language picker on Android now switches the language of the app at once.',
          'Die Sprachauswahl auf Android wechselt die Sprache der App jetzt sofort.',
          'Le sélecteur de langue sur Android change maintenant la langue de l’application aussitôt.',
          'El selector de idioma en Android ahora cambia el idioma de la app al instante.',
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
    ),
    items: [
      {
        kind: 'added',
        text: t(
          'Sign in with your Apple or Google account instead of a password. With the same e-mail address you land in the account you already had. HivePulse only receives your name and address, never a password.',
          'Anmelden mit deinem Apple- oder Google-Konto statt mit Passwort. Mit derselben E-Mail-Adresse landest du in deinem bisherigen Konto. HivePulse erhält nur deinen Namen und deine Adresse, nie ein Passwort.',
          'Connexion avec votre compte Apple ou Google au lieu d’un mot de passe. Avec la même adresse e-mail, vous arrivez dans le compte que vous aviez. HivePulse ne reçoit que votre nom et votre adresse, jamais un mot de passe.',
          'Inicio de sesión con tu cuenta de Apple o Google en lugar de una contraseña. Con el mismo correo entras en la cuenta que tenías. HivePulse solo recibe tu nombre y tu dirección, nunca una contraseña.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'Deleting an account that was made with Apple also withdraws HivePulse’s access at Apple.',
          'Wer ein mit Apple angelegtes Konto löscht, entzieht HivePulse auch den Zugriff bei Apple.',
          'Supprimer un compte créé avec Apple retire aussi l’accès de HivePulse chez Apple.',
          'Al eliminar una cuenta creada con Apple también se retira el acceso de HivePulse en Apple.',
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
    ),
    items: [
      {
        kind: 'added',
        text: t(
          'A guided tour for new users in both apps, shown after the first sign-in and available again from Settings.',
          'Eine geführte Tour für neue Nutzer in beiden Apps, nach der ersten Anmeldung und danach jederzeit in den Einstellungen.',
          'Une visite guidée pour les nouveaux utilisateurs dans les deux applications, après la première connexion et ensuite dans les paramètres.',
          'Un recorrido guiado para nuevos usuarios en ambas apps, tras el primer inicio de sesión y después en los ajustes.',
        ),
      },
      {
        kind: 'added',
        text: t(
          'Crash reports from the apps and the server (EU region), so faults are found before anyone runs into them. No advertising, no tracking of what you do.',
          'Absturzberichte aus den Apps und vom Server (EU-Region), damit Fehler gefunden werden, bevor jemand hineinläuft. Keine Werbung, kein Verfolgen dessen, was du tust.',
          'Rapports de plantage des applications et du serveur (région UE), pour trouver les défauts avant que quiconque les rencontre. Pas de publicité, pas de suivi de ce que vous faites.',
          'Informes de fallos de las apps y del servidor (región UE), para encontrar los fallos antes de que nadie se tope con ellos. Sin publicidad y sin rastrear lo que haces.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'The website has a lighter, calmer look; the Android app is amber again everywhere.',
          'Die Webseite wirkt heller und ruhiger; die Android-App ist überall wieder bernsteinfarben.',
          'Le site a un aspect plus clair et plus calme ; l’application Android retrouve son ambre partout.',
          'La web tiene un aspecto más claro y sereno; la app de Android vuelve a ser ámbar en todas partes.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'Words instead of numbers in the inspection form (colony strength, temper), and frame counts with a tap on the number: made for gloves.',
          'Wörter statt Zahlen im Kontrollformular (Volksstärke, Stimmung) und Waben zählen mit einem Tipp auf die Zahl: gemacht für Handschuhe.',
          'Des mots plutôt que des chiffres dans le formulaire de visite (force de la colonie, humeur) et le comptage des cadres d’un toucher sur le chiffre : pensé pour les gants.',
          'Palabras en lugar de números en el formulario de revisión (fuerza de la colonia, ánimo) y contar cuadros con un toque en el número: pensado para guantes.',
        ),
      },
      {
        kind: 'changed',
        text: t(
          'An apiary can be made public on the community map later, and the news appear in your language.',
          'Ein Bienenstand lässt sich nachträglich auf der Community-Karte öffentlich machen, und die News erscheinen in deiner Sprache.',
          'Un rucher peut être rendu public sur la carte de la communauté après coup, et les actualités s’affichent dans votre langue.',
          'Un colmenar se puede hacer público en el mapa de la comunidad más tarde, y las noticias aparecen en tu idioma.',
        ),
      },
    ],
  },
];

/** The full list of what HivePulse can do. */
export const FEATURES: FeatureGroup[] = [
  {
    id: 'apiaries',
    title: t('Apiaries and hives', 'Bienenstände und Völker', 'Ruchers et ruches', 'Colmenares y colmenas'),
    items: [
      t(
        'Apiaries with name, address or GPS position, description and an optional place on the public community map.',
        'Bienenstände mit Name, Adresse oder GPS-Position, Beschreibung und auf Wunsch einem Platz auf der öffentlichen Community-Karte.',
        'Ruchers avec nom, adresse ou position GPS, description et, au choix, une place sur la carte publique de la communauté.',
        'Colmenares con nombre, dirección o posición GPS, descripción y, si quieres, un lugar en el mapa público de la comunidad.',
      ),
      t(
        'Hives with a type (Langstroth, Dadant, Top Bar, Warré, other), acquisition date and notes.',
        'Völker mit Beutentyp (Langstroth, Dadant, Top Bar, Warré, anderer), Anschaffungsdatum und Notizen.',
        'Ruches avec un type (Langstroth, Dadant, Top Bar, Warré, autre), date d’acquisition et notes.',
        'Colmenas con un tipo (Langstroth, Dadant, Top Bar, Warré, otro), fecha de adquisición y notas.',
      ),
      t(
        'Custom fields for hives and inspections, for your whole account or for a single apiary.',
        'Eigene Felder für Völker und Kontrollen, für das ganze Konto oder für einen einzelnen Bienenstand.',
        'Champs personnalisés pour les ruches et les visites, pour tout le compte ou pour un seul rucher.',
        'Campos propios para colmenas y revisiones, para toda la cuenta o para un solo colmenar.',
      ),
    ],
  },
  {
    id: 'qr',
    title: t('QR codes', 'QR-Codes', 'QR codes', 'Códigos QR'),
    items: [
      t(
        'Generate batches of QR codes in advance and print them as a PDF.',
        'QR-Codes als Batch vorab erzeugen und als PDF drucken.',
        'Générer des lots de QR codes à l’avance et les imprimer en PDF.',
        'Generar lotes de códigos QR por adelantado e imprimirlos en PDF.',
      ),
      t(
        'Scan a sticker to open the hive at once; the first scan of a new code sets the hive up.',
        'Aufkleber scannen und das Volk sofort öffnen; der erste Scan eines neuen Codes richtet das Volk ein.',
        'Scanner un autocollant pour ouvrir la ruche aussitôt ; le premier scan d’un nouveau code crée la ruche.',
        'Escanear una pegatina para abrir la colmena al instante; el primer escaneo de un código nuevo crea la colmena.',
      ),
      t(
        'Delete batches that no hive uses.',
        'Batches löschen, die kein Volk benutzt.',
        'Supprimer les lots qu’aucune ruche n’utilise.',
        'Eliminar los lotes que ninguna colmena usa.',
      ),
    ],
  },
  {
    id: 'inspections',
    title: t('Inspections', 'Kontrollen', 'Visites', 'Revisiones'),
    items: [
      t(
        'Record varroa, temper, queen, brood and honey frames, weight, treatments applied and notes for every visit.',
        'Varroa, Stimmung, Königin, Brut- und Honigwaben, Gewicht, angewendete Behandlungen und Notizen bei jeder Kontrolle erfassen.',
        'Noter varroa, humeur, reine, cadres de couvain et de miel, poids, traitements appliqués et notes à chaque visite.',
        'Anotar varroa, ánimo, reina, cuadros de cría y de miel, peso, tratamientos aplicados y notas en cada revisión.',
      ),
      t(
        'Made for gloves: big buttons, words instead of numbers, frame counts with one tap.',
        'Gemacht für Handschuhe: große Knöpfe, Wörter statt Zahlen, Waben mit einem Tipp zählen.',
        'Pensé pour les gants : grands boutons, des mots plutôt que des chiffres, cadres comptés d’un toucher.',
        'Pensado para guantes: botones grandes, palabras en lugar de números, cuadros contados con un toque.',
      ),
      t(
        'Works without a connection in the apps: visits are kept on the phone and uploaded when the signal returns.',
        'Funktioniert in den Apps ohne Verbindung: Kontrollen bleiben auf dem Telefon und werden hochgeladen, sobald wieder Empfang ist.',
        'Fonctionne sans connexion dans les applications : les visites restent sur le téléphone et sont envoyées au retour du réseau.',
        'Funciona sin conexión en las apps: las revisiones se guardan en el teléfono y se suben cuando vuelve la señal.',
      ),
    ],
  },
  {
    id: 'home',
    title: t('Home screen, treatments and reminders', 'Startseite, Behandlungen und Erinnerungen', 'Accueil, traitements et rappels', 'Inicio, tratamientos y recordatorios'),
    items: [
      t(
        'Home screen: the next inspection, the state of all hives (fine, to watch, alert, unknown, with the reason) and upcoming treatments.',
        'Startseite: die nächste Kontrolle, der Zustand aller Völker (in Ordnung, beobachten, Alarm, unbekannt, mit Grund) und anstehende Behandlungen.',
        'Accueil : la prochaine visite, l’état de toutes les ruches (en ordre, à surveiller, alerte, inconnu, avec la raison) et les traitements à venir.',
        'Inicio: la próxima revisión, el estado de todas las colmenas (bien, a vigilar, alerta, desconocido, con el motivo) y los tratamientos próximos.',
      ),
      t(
        'Plan treatments for a hive or a whole apiary and tick them off.',
        'Behandlungen für ein Volk oder einen ganzen Bienenstand planen und abhaken.',
        'Planifier des traitements pour une ruche ou tout un rucher et les cocher.',
        'Planificar tratamientos para una colmena o un colmenar entero y marcarlos.',
      ),
      t(
        'Inspection reminders with your own interval and season.',
        'Kontrollerinnerungen mit eigenem Intervall und eigener Saison.',
        'Rappels de visites avec votre propre intervalle et votre propre saison.',
        'Recordatorios de revisión con tu propio intervalo y tu propia temporada.',
      ),
    ],
  },
  {
    id: 'year',
    title: t('The beekeeping year', 'Das Imkerjahr', 'L’année apicole', 'El año apícola'),
    items: [
      t(
        'An endless timeline of what to do when: feeding, inspections, swarm control, drone frames, moving and extracting for each kind of honey, varroa treatment and preparing for winter.',
        'Ein endloser Zeitstrahl dessen, was wann zu tun ist: Füttern, Kontrollen, Schwarmkontrolle, Drohnenrahmen, Verlagern und Schleudern für jede Honigsorte, Varroabehandlung und Vorbereitung auf den Winter.',
        'Une frise sans fin de ce qu’il y a à faire et quand : nourrissement, visites, contrôle de l’essaimage, cadres à mâles, déplacements et extraction pour chaque miel, traitement contre le varroa et préparation de l’hiver.',
        'Una línea del tiempo interminable de qué hacer y cuándo: alimentación, revisiones, control de la enjambrazón, cuadros de zánganos, traslados y extracción para cada miel, tratamiento contra la varroa y preparación del invierno.',
      ),
      t(
        'Moved to your place by country and postal code, adjustable by hand, in English, German, French and Spanish.',
        'Auf deinen Ort verschoben nach Land und Postleitzahl, von Hand anpassbar, auf Deutsch, Englisch, Französisch und Spanisch.',
        'Décalée pour votre lieu selon le pays et le code postal, ajustable à la main, en allemand, anglais, français et espagnol.',
        'Adaptada a tu lugar por país y código postal, ajustable a mano, en alemán, inglés, francés y español.',
      ),
    ],
  },
  {
    id: 'moving',
    title: t('Moving hives', 'Völker verlagern', 'Déplacer des ruches', 'Trasladar colmenas'),
    items: [
      t(
        'Move hives between your apiaries or to a new place, with day, forage (acacia, rapeseed, fir, heather and more) and note.',
        'Völker zwischen deinen Bienenständen oder an einen neuen Ort verlagern, mit Tag, Tracht (Akazie, Raps, Tanne, Heide und mehr) und Notiz.',
        'Déplacer des ruches entre vos ruchers ou vers un nouveau lieu, avec jour, miellée (acacia, colza, sapin, bruyère et plus) et note.',
        'Trasladar colmenas entre tus colmenares o a un lugar nuevo, con día, flora (acacia, colza, abeto, brezo y más) y nota.',
      ),
      t(
        'The history of where each hive has stood, and a map of every journey.',
        'Die Geschichte der Standorte jedes Volks und eine Wanderkarte mit jedem Weg.',
        'L’historique des emplacements de chaque ruche et une carte de chaque parcours.',
        'El historial de dónde ha estado cada colmena y un mapa de cada recorrido.',
      ),
      t(
        'A shortcut back to where the hives came from.',
        'Eine Schnellwahl zurück dorthin, wo die Völker herkamen.',
        'Un raccourci pour revenir d’où les ruches venaient.',
        'Un atajo para volver a donde estaban las colmenas.',
      ),
    ],
  },
  {
    id: 'sharing',
    title: t('Working together', 'Zusammenarbeiten', 'Travailler ensemble', 'Trabajar juntos'),
    items: [
      t(
        'Invite another beekeeper by e-mail to an apiary or to single hives; both of you can look and change.',
        'Einen anderen Imker per E-Mail zu einem Bienenstand oder einzelnen Völkern einladen; ihr beide könnt ansehen und ändern.',
        'Inviter un autre apiculteur par e-mail sur un rucher ou sur quelques ruches ; vous pouvez tous deux consulter et modifier.',
        'Invitar por correo a otro apicultor a un colmenar o a colmenas sueltas; ambos podéis ver y cambiar.',
      ),
      t(
        'Deleting, the public map, moving and inviting stay with the owner.',
        'Löschen, öffentliche Karte, Verlagern und Einladen bleiben beim Besitzer.',
        'Supprimer, la carte publique, déplacer et inviter restent au propriétaire.',
        'Eliminar, el mapa público, trasladar e invitar se quedan con el propietario.',
      ),
    ],
  },
  {
    id: 'stats',
    title: t('Statistics and data', 'Statistik und Daten', 'Statistiques et données', 'Estadísticas y datos'),
    items: [
      t(
        'Charts per hive: varroa trend, temper, queen seen, brood frames and the time between inspections.',
        'Diagramme je Volk: Varroa-Verlauf, Stimmung, Königin gesehen, Brutwaben und der Abstand zwischen Kontrollen.',
        'Graphiques par ruche : évolution du varroa, humeur, reine vue, cadres de couvain et délai entre les visites.',
        'Gráficos por colmena: evolución de la varroa, ánimo, reina vista, cuadros de cría y el tiempo entre revisiones.',
      ),
      t(
        'An overview of all your apiaries, and community statistics to compare yourself with.',
        'Eine Übersicht über alle deine Bienenstände und Community-Statistiken zum Vergleichen.',
        'Une vue d’ensemble de tous vos ruchers et des statistiques de la communauté pour vous comparer.',
        'Un resumen de todos tus colmenares y estadísticas de la comunidad para compararte.',
      ),
      t(
        'Export the inspections of an apiary as JSON or CSV.',
        'Die Kontrollen eines Bienenstands als JSON oder CSV exportieren.',
        'Exporter les visites d’un rucher en JSON ou CSV.',
        'Exportar las revisiones de un colmenar como JSON o CSV.',
      ),
    ],
  },
  {
    id: 'hornets',
    title: t('Hornet tracker', 'Hornissen-Tracker', 'Suivi des frelons', 'Rastreador de avispas'),
    items: [
      t(
        'Report Asian hornet catches and nests, with photos that the community votes on.',
        'Fänge und Nester der Asiatischen Hornisse melden, mit Fotos, über die die Community abstimmt.',
        'Signaler des captures et des nids de frelon asiatique, avec des photos soumises au vote de la communauté.',
        'Informar de capturas y nidos de avispón asiático, con fotos que vota la comunidad.',
      ),
      t(
        'A live map of nests and traps, and named traps with an access code for daily catch counts.',
        'Eine Live-Karte von Nestern und Fallen und benannte Fallen mit Zugangscode für die täglichen Fangzahlen.',
        'Une carte en direct des nids et des pièges, et des pièges nommés avec un code d’accès pour les comptes quotidiens.',
        'Un mapa en vivo de nidos y trampas, y trampas con nombre y código de acceso para los recuentos diarios.',
      ),
    ],
  },
  {
    id: 'account',
    title: t('Account and privacy', 'Konto und Datenschutz', 'Compte et confidentialité', 'Cuenta y privacidad'),
    items: [
      t(
        'Sign in with e-mail, Apple or Google; four languages: English, German, French and Spanish.',
        'Anmelden mit E-Mail, Apple oder Google; vier Sprachen: Englisch, Deutsch, Französisch und Spanisch.',
        'Connexion par e-mail, Apple ou Google ; quatre langues : anglais, allemand, français et espagnol.',
        'Inicio de sesión con correo, Apple o Google; cuatro idiomas: inglés, alemán, francés y español.',
      ),
      t(
        'Delete your account and all your data yourself, at any time.',
        'Konto und alle Daten jederzeit selbst löschen.',
        'Supprimer vous-même votre compte et toutes vos données, à tout moment.',
        'Eliminar tú mismo tu cuenta y todos tus datos, en cualquier momento.',
      ),
      t(
        'No advertising network and no tracking of what you do.',
        'Kein Werbenetzwerk und kein Verfolgen dessen, was du tust.',
        'Pas de régie publicitaire et pas de suivi de ce que vous faites.',
        'Sin red publicitaria y sin rastrear lo que haces.',
      ),
    ],
  },
  {
    id: 'platforms',
    title: t('Website and apps', 'Webseite und Apps', 'Site et applications', 'Web y apps'),
    items: [
      t(
        'Website, iPhone app and Android app, with the same layout in both apps.',
        'Webseite, iPhone-App und Android-App, in beiden Apps gleich aufgebaut.',
        'Site, application iPhone et application Android, construites de la même façon dans les deux applications.',
        'Web, app de iPhone y app de Android, organizadas igual en ambas apps.',
      ),
      t(
        'A guided tour, help pages in four languages, news and these release notes.',
        'Eine geführte Tour, Hilfeseiten in vier Sprachen, News und diese Release Notes.',
        'Une visite guidée, des pages d’aide en quatre langues, des actualités et ces notes de version.',
        'Un recorrido guiado, páginas de ayuda en cuatro idiomas, noticias y estas notas de versión.',
      ),
    ],
  },
];
