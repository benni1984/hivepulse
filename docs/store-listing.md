# Store listing texts

Ready to paste into the Google Play Console and App Store Connect. Character limits are
enforced by both consoles, so the counts below are the ones that matter; every text here is
within them.

**Uploading — Google Play.** Actions → "Play Metadata" reads the texts below and sends the
title, both descriptions, the screenshots, the icon and the feature graphic to the Play
Console through the API, in all five languages. "Which pictures to send" is a dropdown:
`latest` takes them from the newest run that still holds a `play-screenshots-*` artefact —
which is usually an "Update help page screenshots" run, since that is what retakes them — `keep`
leaves the ones in the console alone and changes only the texts, and `run_id` uses the run typed
into `screenshots_run_id`, checked for still holding the pictures before anything downloads. It starts as a dry run, checks Play's length limits first, and
never releases anything — the bundle and the "What's new" notes go up with "Android Release
Bundle". Edit the text here, not in the console, or the next upload overwrites it.
`scripts/build_play_metadata.py` is the parser and `scripts/upload_play_metadata.py` the
uploader.

**Uploading — App Store.** The App Store texts below are not typed in by hand: Actions → "App Store
Metadata" reads them from this file and sends them to App Store Connect through the API. It
starts as a dry run, checks Apple's length limits first, never submits for review, and can
upload the screenshots from an "iOS Store Screenshots" run. Edit the text here, not in the
console, or the next upload overwrites it. **Once, before the first upload:** fill in
"App Review Information" (name, phone, email) on the version page in App Store Connect. Deliver
reads that record at the very end of the text upload and stops with `No data` while it does not
exist (first run, 37992872482); the texts of all languages are sent before that point, the
screenshots after it. The workflow activates missing languages itself. `scripts/build_appstore_metadata.py` is the parser:
it relies on the `**en**` blocks and the tables keeping their current shape.

Both stores list a language separately. Fill the five below and leave the rest to Play's
automatic translation — or rather, do not: an automatically translated listing reads like
one, and beekeepers notice.

**Not marketing copy for its own sake.** Every claim here is something the app does today.
"Works offline" is in because it does; there is no "AI-powered" anything, because there
isn't.

---

## Google Play

### App name — max 30

| Locale | Text | Count |
|--------|------|-------|
| en | `HivePulse — Beekeeping Log` | 26 |
| de | `HivePulse — Imker-Journal` | 25 |
| fr | `HivePulse — Journal rucher` | 26 |
| es | `HivePulse — Diario apícola` | 26 |
| pl | `HivePulse — Dziennik pasieki` | 28 |

### Short description — max 80

**en**
```
Scan the QR code on a hive and log the visit. Works without a signal.
```
(69)

**de**
```
QR-Code am Volk scannen und die Durchsicht erfassen. Geht auch ohne Netz.
```
(73)

**fr**
```
Scannez le QR de la ruche et notez la visite. Fonctionne sans réseau.
```
(69)

**es**
```
Escanea el QR de la colmena y anota la visita. Funciona sin cobertura.
```
(70)

**pl**
```
Zeskanuj kod QR na ulu i zapisz przegląd. Działa też bez zasięgu.
```
(65)

### Full description — max 4000

**en**
```
HivePulse turns a hive visit into half a minute of tapping.

Stick a QR code on each hive. Scan it, and the app opens that hive straight away — no scrolling through a list with cold hands. Log what you saw: brood and honey frames, queen sighted, temperament, varroa count, treatments, feed, your own notes. Numbers from 0 to 10 are large buttons, not tiny arrows, so the form works with gloves on.

WORKS WITHOUT A SIGNAL
Apiaries are rarely where the bars are. Inspections you record offline are stored on the phone and sent as soon as there is a connection again. Nothing is lost, and a retry can never produce a duplicate visit.

YOUR OWN FIELDS
Every beekeeper counts something nobody else does. Add your own fields — for all your hives or just one apiary — and they appear in the form like the built-in ones.

SEE THE SEASON
Per hive and per apiary: how the colony developed, when the varroa count rose, which hives you have not visited in a while. The kind of thing that is obvious in hindsight and invisible in a paper notebook.

THE ASIAN HORNET
A tracker for Vespa velutina: report a catch, a nest or a sighting with a photo, see what others have reported nearby, and run your own named traps with a daily catch count. A community checks the photo reports, because a hornet is easy to misidentify.

PRIVATE BY DEFAULT
Your apiaries are private. If you choose to put one on the public map, it shows at city level, never at your exact coordinates — the point is to show beekeeping activity, not where the hives are. You can switch it off again at any time.

NO ADS, NO DATA SALE
No advertising, no tracking for advertising, and nothing about you is sold or passed on. The project is open source.

FREE FOR UP TO TEN COLONIES
Everything above is free for up to ten colonies. The Asian hornet tracker, the beekeeping year, QR codes, offline inspections and the export of your own data stay free however many you keep.

HivePulse Supporter lifts the limit and adds your own fields, inviting somebody to an apiary or a single hive, the whole statistics history instead of the last year, the treatment record, and the regional health map. 19.99 EUR a year, renewing until you cancel. Bought in the app it is managed and cancelled in your store account; bought on the website, on the subscription page. Reaching the limit never takes anything away: nothing you have recorded is hidden or deleted, with or without a subscription.

Terms of use: https://hivepulse.multihead.de/terms
Privacy policy: https://hivepulse.multihead.de/privacy

Bees do not read release notes. The app tries to stay out of the way while you work.
```
(1883)

**de**
```
HivePulse macht aus einer Durchsicht eine halbe Minute Tippen.

Kleb einen QR-Code auf jedes Volk. Scannen, und die App öffnet genau dieses Volk — kein Scrollen durch eine Liste mit kalten Händen. Erfasse, was du gesehen hast: Brut- und Honigrahmen, Königin gesehen, Sanftmut, Varroa-Zahl, Behandlungen, Futter, eigene Notizen. Zahlen von 0 bis 10 sind große Knöpfe statt winziger Pfeile, damit das Formular auch mit Handschuhen funktioniert.

GEHT AUCH OHNE NETZ
Bienenstände stehen selten da, wo der Empfang ist. Durchsichten, die du offline erfasst, liegen auf dem Handy und gehen raus, sobald wieder Verbindung da ist. Nichts geht verloren, und ein zweiter Versuch kann keinen Doppeleintrag erzeugen.

EIGENE FELDER
Jeder Imker zählt etwas, das sonst niemand zählt. Lege eigene Felder an — für alle Völker oder nur für einen Stand — und sie erscheinen im Formular wie die eingebauten.

DIE SAISON SEHEN
Pro Volk und pro Stand: wie sich das Volk entwickelt hat, wann die Varroa-Zahl gestiegen ist, welche Völker du länger nicht besucht hast. Dinge, die im Rückblick offensichtlich sind und im Papierheft unsichtbar bleiben.

DIE ASIATISCHE HORNISSE
Ein Tracker für Vespa velutina: Fang, Nest oder Sichtung mit Foto melden, sehen was andere in der Nähe gemeldet haben, und eigene benannte Fallen mit täglicher Fangzahl führen. Die Foto-Meldungen prüft die Gemeinschaft, denn eine Hornisse verwechselt man leicht.

STANDARDMÄSSIG PRIVAT
Deine Bienenstände sind privat. Wenn du einen auf die öffentliche Karte stellst, erscheint er auf Stadtebene und nie an deinen genauen Koordinaten — es geht darum, Imkerei sichtbar zu machen, nicht die Standorte. Abschalten kannst du es jederzeit wieder.

KEINE WERBUNG, KEIN DATENVERKAUF
Keine Werbung, keine Verfolgung für Werbung, und nichts über dich wird verkauft oder weitergegeben. Das Projekt ist Open Source.

BIS ZEHN VÖLKER KOSTENLOS
Alles oben Genannte ist bis zehn Völker kostenlos. Der Hornissen-Tracker, das Imkerjahr, die QR-Codes, Kontrollen ohne Netz und der Export deiner eigenen Daten bleiben kostenlos, egal wie viele Völker du führst.

HivePulse Supporter hebt die Grenze auf und bringt dazu eigene Felder, das Einladen anderer zu einem Bienenstand oder einem einzelnen Volk, die ganze Statistik-Historie statt nur des letzten Jahres, das Bestandsbuch und die regionale Gesundheitskarte. 19,99 € im Jahr, läuft bis zur Kündigung weiter. In der App gekauft, wird es im Store-Konto verwaltet und gekündigt; auf der Webseite gekauft, auf der Abo-Seite. Die Grenze nimmt nie etwas weg: nichts, was du erfasst hast, wird versteckt oder gelöscht — mit Abo wie ohne.

Nutzungsbedingungen: https://hivepulse.multihead.de/de/terms
Datenschutzerklärung: https://hivepulse.multihead.de/de/privacy

Bienen lesen keine Versionshinweise. Die App versucht, dir bei der Arbeit nicht im Weg zu stehen.
```
(2035)

**fr**
```
HivePulse réduit une visite de ruche à une demi-minute d'appuis.

Collez un QR code sur chaque ruche. Scannez-le, et l'application ouvre directement cette ruche — sans faire défiler une liste les mains froides. Notez ce que vous avez vu : cadres de couvain et de miel, reine vue, douceur, comptage varroa, traitements, nourrissement, vos propres notes. Les chiffres de 0 à 10 sont de grands boutons et non de minuscules flèches, pour que le formulaire reste utilisable avec des gants.

FONCTIONNE SANS RÉSEAU
Les ruchers sont rarement là où il y a du réseau. Les visites saisies hors ligne restent sur le téléphone et partent dès que la connexion revient. Rien n'est perdu, et une nouvelle tentative ne peut pas créer de doublon.

VOS PROPRES CHAMPS
Chaque apiculteur compte quelque chose que personne d'autre ne compte. Créez vos propres champs — pour toutes vos ruches ou pour un seul rucher — et ils apparaissent dans le formulaire comme ceux d'origine.

VOIR LA SAISON
Par ruche et par rucher : comment la colonie a évolué, quand le comptage varroa a augmenté, quelles ruches vous n'avez pas visitées depuis un moment. Des choses évidentes après coup et invisibles dans un carnet papier.

LE FRELON ASIATIQUE
Un suivi de Vespa velutina : signalez une capture, un nid ou une observation avec photo, voyez ce que d'autres ont signalé autour de vous, et gérez vos propres pièges nommés avec un comptage quotidien. Les signalements photo sont vérifiés par la communauté, car un frelon se confond facilement.

PRIVÉ PAR DÉFAUT
Vos ruchers sont privés. Si vous en placez un sur la carte publique, il apparaît à l'échelle de la commune et jamais à vos coordonnées exactes — le but est de montrer l'activité apicole, pas les emplacements. Vous pouvez le désactiver à tout moment.

NI PUBLICITÉ NI VENTE DE DONNÉES
Aucune publicité, aucun pistage publicitaire, et rien de vous n'est vendu ni transmis. Le projet est open source.

GRATUIT JUSQU'À DIX RUCHES
Tout ce qui précède est gratuit jusqu'à dix ruches. Le suivi du frelon asiatique, l'année apicole, les QR codes, les visites hors ligne et l'export de vos données restent gratuits quel que soit votre cheptel.

HivePulse Supporter lève la limite et ajoute vos propres champs, l'invitation d'une personne sur un rucher ou une seule ruche, tout l'historique des statistiques au lieu de la dernière année, le registre des traitements et la carte sanitaire régionale. 19,99 € par an, reconduit jusqu'à résiliation. Acheté dans l'application, il se gère et se résilie depuis votre compte du magasin ; acheté sur le site, depuis la page d'abonnement. Atteindre la limite ne retire jamais rien : rien de ce que vous avez enregistré n'est masqué ni supprimé, avec ou sans abonnement.

Conditions d'utilisation : https://hivepulse.multihead.de/fr/terms
Politique de confidentialité : https://hivepulse.multihead.de/fr/privacy

Les abeilles ne lisent pas les notes de version. L'application essaie de ne pas vous gêner pendant le travail.
```
(2103)

**es**
```
HivePulse convierte una revisión de colmena en medio minuto de toques.

Pega un código QR en cada colmena. Escanéalo y la aplicación abre esa colmena directamente, sin recorrer una lista con las manos frías. Anota lo que has visto: cuadros de cría y de miel, reina vista, mansedumbre, recuento de varroa, tratamientos, alimentación y tus propias notas. Los números del 0 al 10 son botones grandes en lugar de flechas diminutas, para que el formulario funcione con guantes.

FUNCIONA SIN COBERTURA
Los colmenares rara vez están donde hay cobertura. Las revisiones que anotas sin conexión se guardan en el teléfono y se envían en cuanto vuelve la señal. Nada se pierde, y un segundo intento no puede crear un duplicado.

TUS PROPIOS CAMPOS
Cada apicultor cuenta algo que no cuenta nadie más. Crea tus propios campos —para todas tus colmenas o solo para un colmenar— y aparecerán en el formulario como los de serie.

VER LA TEMPORADA
Por colmena y por colmenar: cómo ha evolucionado la colonia, cuándo subió el recuento de varroa, qué colmenas llevas tiempo sin visitar. Cosas evidentes en retrospectiva e invisibles en un cuaderno de papel.

LA AVISPA ASIÁTICA
Un seguimiento de Vespa velutina: informa de una captura, un nido o un avistamiento con foto, mira qué han informado otros cerca de ti y lleva tus propias trampas con nombre y recuento diario. Los avisos con foto los revisa la comunidad, porque un avispón se confunde con facilidad.

PRIVADO POR DEFECTO
Tus colmenares son privados. Si colocas uno en el mapa público, aparece a escala de municipio y nunca en tus coordenadas exactas: la idea es mostrar la actividad apícola, no las ubicaciones. Puedes desactivarlo cuando quieras.

SIN ANUNCIOS NI VENTA DE DATOS
Sin publicidad, sin rastreo publicitario, y nada sobre ti se vende ni se cede. El proyecto es de código abierto.

GRATIS HASTA DIEZ COLMENAS
Todo lo anterior es gratis hasta diez colmenas. El rastreador de avispa asiática, el año apícola, los códigos QR, las revisiones sin red y la exportación de tus datos siguen siendo gratis tengas las que tengas.

HivePulse Supporter quita el límite y añade tus propios campos, invitar a alguien a un colmenar o a una sola colmena, todo el historial de estadísticas en lugar del último año, el libro de tratamientos y el mapa sanitario regional. 19,99 € al año, se renueva hasta que lo canceles. Comprado en la app se gestiona y se cancela en tu cuenta de la tienda; comprado en la web, en la página de suscripción. Llegar al límite nunca quita nada: nada de lo que has registrado se oculta ni se borra, con o sin suscripción.

Condiciones de uso: https://hivepulse.multihead.de/es/terms
Política de privacidad: https://hivepulse.multihead.de/es/privacy

Las abejas no leen notas de versión. La aplicación intenta no estorbar mientras trabajas.
```
(1996)

**pl**
```
HivePulse zamienia przegląd w pół minuty stukania.

Naklej kod QR na każdy ul. Zeskanuj go, a aplikacja od razu otworzy właśnie ten ul — bez przewijania listy zmarzniętymi rękami. Zapisz obserwacje: ramki z czerwiem i miodem, widziana matka, łagodność, liczba warrozy, zabiegi, dokarmianie, własne notatki. Liczby od 0 do 10 to duże przyciski zamiast małych strzałek, więc formularz działa także w rękawicach.

DZIAŁA BEZ ZASIĘGU
Pasieki rzadko stoją tam, gdzie jest zasięg. Przeglądy zapisane offline czekają w telefonie i wysyłają się, gdy tylko wróci połączenie. Nic nie ginie, a ponowna próba nie utworzy duplikatu.

WŁASNE POLA
Każdy pszczelarz liczy coś, czego nikt inny nie liczy. Dodaj własne pola — dla wszystkich rodzin albo tylko dla jednej pasieki — a pojawią się w formularzu jak te wbudowane.

ZOBACZ SEZON
Dla każdej rodziny i każdej pasieki: jak rozwijała się rodzina pszczela, kiedy wzrosła liczba warrozy, które rodziny od dawna czekają na przegląd. Rzeczy oczywiste z perspektywy czasu, a niewidoczne w papierowym zeszycie.

SZERSZEŃ AZJATYCKI
Tracker Vespa velutina: zgłoś odłów, gniazdo lub obserwację ze zdjęciem, zobacz, co zgłosili inni w pobliżu, i prowadź własne, nazwane pułapki z dziennym licznikiem odłowów. Zgłoszenia ze zdjęciami sprawdza społeczność, bo szerszenia łatwo pomylić.

DOMYŚLNIE PRYWATNIE
Twoje pasieki są prywatne. Jeśli umieścisz jedną na publicznej mapie, pojawi się na poziomie miejscowości, nigdy w dokładnych współrzędnych — chodzi o pokazanie pszczelarstwa, a nie lokalizacji uli. W każdej chwili możesz to wyłączyć.

BEZ REKLAM, BEZ SPRZEDAŻY DANYCH
Żadnych reklam, żadnego śledzenia reklamowego i nic o Tobie nie jest sprzedawane ani przekazywane. Projekt jest open source.

DO DZIESIĘCIU RODZIN ZA DARMO
Wszystko powyższe jest bezpłatne do dziesięciu rodzin pszczelich. Tropiciel szerszenia azjatyckiego, rok pszczelarski, kody QR, przeglądy bez zasięgu i eksport własnych danych pozostają bezpłatne niezależnie od ich liczby.

HivePulse Supporter znosi limit i dodaje własne pola, zapraszanie kogoś do pasieki lub pojedynczej rodziny, całą historię statystyk zamiast ostatniego roku, książkę leczenia oraz regionalną mapę zdrowia. 19,99 € rocznie, odnawia się do czasu rezygnacji. Kupiony w aplikacji jest zarządzany i anulowany na koncie sklepu; kupiony w serwisie — na stronie abonamentu. Osiągnięcie limitu nigdy niczego nie odbiera: nic z tego, co zapisałeś, nie jest ukrywane ani usuwane — z abonamentem czy bez.

Warunki korzystania: https://hivepulse.multihead.de/pl/terms
Polityka prywatności: https://hivepulse.multihead.de/pl/privacy

Pszczoły nie czytają informacji o wersji. Aplikacja stara się nie przeszkadzać w pracy.
```
(1899)

---

## App Store

The App Store splits the text differently: a 30-character subtitle carries the weight that
Play gives to the short description, and keywords are a separate field nobody sees.

### Subtitle — max 30

| Locale | Text | Count |
|--------|------|-------|
| en | `Hive inspections, offline` | 25 |
| de | `Durchsichten, auch offline` | 26 |
| fr | `Visites de ruches, hors ligne` | 29 |
| es | `Revisiones, también sin red` | 27 |
| pl | `Przeglądy uli, także offline` | 28 |

### Keywords — max 100, comma separated, no spaces after commas

**en**
```
beekeeping,beehive,apiary,inspection,varroa,queen,hornet,velutina,honey,swarm,logbook,qr
```
(88)

**de**
```
imkerei,bienen,bienenstock,volk,durchsicht,varroa,koenigin,hornisse,velutina,honig,imkerbuch
```
(92)

**fr**
```
apiculture,ruche,rucher,visite,varroa,reine,frelon,velutina,miel,essaim,carnet
```
(78)

**es**
```
apicultura,colmena,colmenar,revision,varroa,reina,avispa,avispon,velutina,miel,enjambre,cuaderno
```
(96)

**pl**
```
pszczelarstwo,ul,pasieka,przeglad,warroza,matka,szerszen,velutina,miod,roj,dziennik,qr,rodzina
```
(94)

### Promotional text — max 170, changeable without a review

**en**
```
Inspections now work without a signal: record the visit at the hive and the app sends it when you are back in range.
```
(116)

**de**
```
Durchsichten gehen jetzt ohne Netz: am Volk erfassen, und die App schickt sie los, sobald du wieder Empfang hast.
```
(113)

**fr**
```
Les visites fonctionnent désormais hors ligne : saisissez à la ruche, l'application envoie dès que le réseau revient.
```
(117)

**es**
```
Las revisiones ya funcionan sin cobertura: anota en la colmena y la app lo envía cuando vuelvas a tener señal.
```
(110)

**pl**
```
Przeglądy działają teraz bez zasięgu: zapisz je przy ulu, a aplikacja wyśle je, gdy tylko znów będziesz w zasięgu.
```
(114)

### Description

Use the Play full description above; both stores allow 4000 characters and the text fits
either. The App Store shows the first three lines before "more", which is why the first
paragraph says what the app is rather than greeting the reader.

### What's New — max 4000

The release this describes is **1.1.0**. It is the App Store's release notes; Play takes its own
from `distribution/whatsnew/` during the automated upload, and those are Android's four lines, not
these. Keep the two apart: a fix that only happened on one platform belongs only in that
platform's notes.

`__tests__/ReleaseNotes.test.ts` checks that the version named above is the one in
`CFBundleShortVersionString` — it sat at 1.0.5 here while the iPhone built 1.1.0, which is
exactly the drift #431 was about, one field further along.

**en**
```
A hive visit is a record you are required to keep. In most of Europe a treatment with a
veterinary medicine has to be written down and kept for five years, and bees are food-producing
animals like any other. The app has had every one of those entries all along; it just could not
hand them to you as a document.

Now it can. Under treatments there is a year's worth as a PDF — what was given, to which colony,
how much, and the waiting period before the honey may be taken. Print it, file it, show it. A
treatment entry now carries the amount and the waiting period, because a record without them
answers the wrong half of the question.

The subscription can be bought here. Up to ten colonies HivePulse is free and stays free — and
the hornet tracker, the beekeeping year, QR codes, offline inspections and the export of your
own data are free however many you keep. Above that, HivePulse Supporter lifts the limit and
adds your own fields, inviting somebody to an apiary or a single hive, the whole statistics
history, the treatment record and the regional health map. It is under Settings, with Restore
purchase on the same screen — a new phone or a reinstall is one tap, not a support mail.

Reaching the limit never takes anything away. Nothing you have recorded is hidden or deleted,
with or without a subscription; you simply cannot add an eleventh colony until there is one.

And after a few days the app asks, once, how it is going. Whichever button you press it does not
come back. The answers are read — the last round of reports became ten fixes in two days.

Fixed: after about a month the app could get stuck behind a message about sign-in details. The
session had simply run out; it now signs you back in instead of talking about tokens.
```
(1752)

**de**
```
Eine Durchsicht ist eine Aufzeichnung, die du führen musst. In weiten Teilen Europas muss
jede Behandlung mit einem Tierarzneimittel festgehalten und fünf Jahre aufbewahrt werden, und
Bienen sind Lebensmittel liefernde Tiere wie andere auch. Die App hatte diese Einträge immer
schon — sie konnte sie dir nur nicht als Dokument geben.

Jetzt kann sie es. Unter den Behandlungen liegt ein ganzes Jahr als PDF: was gegeben wurde,
welchem Volk, wie viel, und die Wartezeit, bis der Honig genommen werden darf. Ausdrucken,
abheften, vorlegen. Eine Behandlung nimmt jetzt Menge und Wartezeit auf, denn ein Bestandsbuch
ohne beides beantwortet die falsche Hälfte der Frage.

Das Abo lässt sich hier kaufen. Bis zehn Völker ist HivePulse kostenlos und bleibt es — und der
Hornissen-Tracker, das Imkerjahr, die QR-Codes, Kontrollen ohne Netz und der Export deiner
eigenen Daten sind kostenlos, egal wie viele Völker du führst. Darüber hinaus hebt HivePulse
Supporter die Grenze auf und bringt eigene Felder, das Einladen anderer zu einem Bienenstand
oder einem einzelnen Volk, die ganze Statistik-Historie, das Bestandsbuch und die regionale
Gesundheitskarte. Zu finden in den Einstellungen, mit „Kauf wiederherstellen“ auf derselben
Seite — ein neues Handy oder eine Neuinstallation ist ein Tipp und keine Support-Mail.

Die Grenze nimmt nie etwas weg. Nichts, was du erfasst hast, wird versteckt oder gelöscht, mit
Abo wie ohne; du kannst nur kein elftes Volk anlegen, solange keines da ist.

Und nach ein paar Tagen fragt die App einmal, wie es läuft. Welchen Knopf du auch drückst, sie
kommt nicht wieder. Die Antworten werden gelesen — aus der letzten Runde wurden in zwei Tagen
zehn Korrekturen.

Behoben: Nach etwa einem Monat konnte die App hinter einer Meldung über Anmeldedaten
hängenbleiben. Die Sitzung war schlicht abgelaufen; jetzt meldet sie dich wieder an, statt von
Tokens zu reden.
```
(1890)

**fr**
```
Une visite de ruche est un registre que vous devez tenir. Dans une grande partie de l'Europe,
tout traitement avec un médicament vétérinaire doit être consigné et conservé cinq ans, et les
abeilles sont des animaux producteurs de denrées comme les autres. L'application avait déjà
toutes ces entrées — elle ne savait simplement pas vous les remettre sous forme de document.

C'est fait. Sous les traitements, une année entière en PDF : ce qui a été administré, à quelle
colonie, en quelle quantité, et le délai d'attente avant de récolter le miel. À imprimer, à
classer, à présenter. Un traitement enregistre désormais la quantité et le délai d'attente, car
un registre sans les deux répond à la mauvaise moitié de la question.

L'abonnement s'achète ici. Jusqu'à dix ruches HivePulse est gratuit et le reste — et le suivi du
frelon asiatique, l'année apicole, les QR codes, les visites hors ligne et l'export de vos
données sont gratuits quel que soit votre cheptel. Au-delà, HivePulse Supporter lève la limite
et ajoute vos propres champs, l'invitation d'une personne sur un rucher ou une seule ruche, tout
l'historique des statistiques, le registre des traitements et la carte sanitaire régionale. Dans
les Réglages, avec « Restaurer l'achat » sur le même écran — un nouveau téléphone ou une
réinstallation, c'est une touche et non un courriel au support.

Atteindre la limite ne retire jamais rien. Rien de ce que vous avez enregistré n'est masqué ni
supprimé, avec ou sans abonnement ; vous ne pouvez simplement pas ajouter une onzième ruche.

Et après quelques jours, l'application demande une fois comment ça se passe. Quel que soit le
bouton, elle ne revient pas. Les réponses sont lues — la dernière série a donné dix corrections
en deux jours.

Corrigé : au bout d'un mois environ, l'application pouvait rester bloquée derrière un message sur
les identifiants. La session avait simplement expiré ; elle vous reconnecte désormais au lieu de
parler de jetons.
```
(1967)

**es**
```
Una revisión es un registro que estás obligado a llevar. En buena parte de Europa todo
tratamiento con un medicamento veterinario debe anotarse y conservarse cinco años, y las abejas
son animales productores de alimentos como cualquier otro. La app tenía todas esas entradas
desde siempre; lo que no sabía era entregártelas como documento.

Ya sabe. Bajo los tratamientos hay un año entero en PDF: qué se administró, a qué colmena, en
qué cantidad y el tiempo de espera antes de poder retirar la miel. Imprímelo, archívalo,
preséntalo. Un tratamiento recoge ahora la cantidad y el tiempo de espera, porque un libro sin
ambos responde a la mitad equivocada de la pregunta.

La suscripción se compra aquí. Hasta diez colmenas HivePulse es gratis y lo seguirá siendo — y
el rastreador de avispa asiática, el año apícola, los códigos QR, las revisiones sin red y la
exportación de tus datos son gratis tengas las que tengas. Por encima, HivePulse Supporter quita
el límite y añade tus propios campos, invitar a alguien a un colmenar o a una sola colmena, todo
el historial de estadísticas, el libro de tratamientos y el mapa sanitario regional. Está en
Ajustes, con «Restaurar la compra» en la misma pantalla: un móvil nuevo o una reinstalación es
un toque, no un correo al soporte.

Llegar al límite nunca quita nada. Nada de lo registrado se oculta ni se borra, con o sin
suscripción; simplemente no puedes añadir una undécima colmena hasta que la haya.

Y al cabo de unos días la app pregunta, una vez, cómo va. Pulses el botón que pulses, no vuelve.
Las respuestas se leen: de la última ronda salieron diez correcciones en dos días.

Corregido: al cabo de un mes aproximadamente la app podía quedarse detrás de un mensaje sobre
las credenciales. La sesión simplemente había caducado; ahora vuelve a iniciarla en lugar de
hablar de tokens.
```
(1838)

**pl**
```
Przegląd to dokumentacja, którą musisz prowadzić. W większości Europy każde leczenie
produktem weterynaryjnym trzeba zapisać i przechowywać pięć lat, a pszczoły są zwierzętami
produkującymi żywność jak każde inne. Aplikacja miała te wpisy od zawsze — nie potrafiła ich
tylko podać jako dokumentu.

Teraz potrafi. W leczeniu znajdziesz cały rok w PDF: co podano, której rodzinie, ile i jaki jest
okres karencji, zanim można odebrać miód. Wydrukuj, włóż do segregatora, pokaż. Wpis o leczeniu
przyjmuje teraz ilość i okres karencji, bo książka bez nich odpowiada na złą połowę pytania.

Abonament można kupić tutaj. Do dziesięciu rodzin HivePulse jest darmowy i taki zostanie — a
tropiciel szerszenia azjatyckiego, rok pszczelarski, kody QR, przeglądy bez zasięgu i eksport
własnych danych są darmowe niezależnie od ich liczby. Powyżej HivePulse Supporter znosi limit i
dodaje własne pola, zapraszanie kogoś do pasieki lub pojedynczej rodziny, całą historię
statystyk, książkę leczenia i regionalną mapę zdrowia. Jest w Ustawieniach, a „Przywróć
zakup” na tym samym ekranie — nowy telefon albo ponowna instalacja to jedno dotknięcie, nie
mail do wsparcia.

Osiągnięcie limitu nigdy niczego nie odbiera. Nic z zapisanych danych nie jest ukrywane ani
usuwane, z abonamentem czy bez; po prostu nie dodasz jedenastej rodziny, dopóki nie ma miejsca.

A po kilku dniach aplikacja pyta raz, jak idzie. Którykolwiek przycisk naciśniesz, nie wraca.
Odpowiedzi są czytane — z ostatniej rundy powstało w dwa dni dziesięć poprawek.

Poprawione: po około miesiącu aplikacja potrafiła utknąć za komunikatem o danych logowania.
Sesja po prostu wygasła; teraz loguje Cię z powrotem, zamiast mówić o tokenach.
```
(1690)

## The other fields

| Field | Value |
|-------|-------|
| Category | Play: **Productivity** (*Effizienz*), tags *Notebook* and *Barcode scanner*; App Store: *Utilities* with *Education* as secondary |
| Website | <https://hivepulse.multihead.de> |
| Support URL | <https://hivepulse.multihead.de/help> |
| Privacy policy URL | <https://hivepulse.multihead.de/privacy> |
| Contact email | hivepulse@multihead.de |
| Content rating | Play questionnaire: no violence, no gambling, user-generated content **yes** (hornet photo reports) |
| Age rating | App Store: 4+, with "user generated content" declared for the same reason |

**The user-generated content question matters.** Hornet sighting photos are user content,
so both stores want to know that reports can be moderated and that there is a way to
report abuse. The admin moderation for sightings exists; the listing has to say so.

## Graphics

`scripts/make_store_graphics.py` redraws both bitmaps Play insists on, from the same geometry
as `public/brand/hivepulse-logo.svg`:

| File | Size | Where |
|------|------|-------|
| `public/brand/play-icon-512.png` | 512×512 | App icon |
| `public/brand/play-feature-1024x500.png` | 1024×500 | Feature graphic |

Both are **wordless apart from the brand name**, so one of each serves all four languages —
text on them would mean four versions, and "HivePulse" is the same everywhere. The feature
graphic is saved without an alpha channel, which Play requires and which a test pins.

Icon and feature graphic are language-independent in practice; **screenshots are not**, since
the interface in them is in one language. Play falls back to the default language's graphics
for any language where none are uploaded, so one set works to start with.

## Screenshots

**Play accepts 8 phone screenshots per language, the App Store 10**, and each language is
listed separately — a German listing showing an English interface reads as "not translated".

**Actions → "iOS Store Screenshots"** captures the iPhone set in all five languages and
uploads two artifacts per language: `app-store-screenshots-<lang>` holds exactly the eight
below, numbered in upload order, and `all-screenshots-<lang>` holds all nineteen for
reference.

| # | Screen | Why it earns a slot |
|---|--------|---------------------|
| 1 | Apiary list | What the app is, in one picture |
| 2 | Hive with its history | The reason to keep using it |
| 3 | Inspection form | The daily work |
| 4 | Frame buttons 0–10 | The gloves argument, visible at a glance |
| 5 | Apiary detail | How hives are organised |
| 6 | QR batches | The QR idea, which is the hook |
| 7 | Community stats | That there are others |
| 8 | Settings | Reminders and language exist |

Login and registration are deliberately absent: nobody installs an app because of its login
form. The offline state would deserve a slot, but it needs a capture with the pending marker
visible, which the screenshot test does not produce yet.

Play also wants at least 320px and at most 3840px per side; the App Store wants 1320×2868 or
1290×2796 for the 6.9" slot and derives the smaller sizes from it.

`public/docs/screenshots/` already holds captures taken for the help pages. Measured, not
assumed:

| | Files | Size | Verdict |
|---|---|---|---|
| Android | 16 | 1080×2424 and 1080×2400 | short side is fine; the ratio is taller than 9:16 |
| iOS | 1 | 603×1311 | far too small, and one is not enough |

**Android is probably ready to upload as is.** Play wants at least 320px and at most 3840px
per side, which these clear. Their ratio (1:2.24) is taller than the 9:16 the older
guidance names; modern phone captures usually pass anyway. If the console refuses one, a
centre crop to 1080×1920 fixes it — ask and it will be generated rather than guessed at.

**iOS has to be redone.** The App Store wants 1290×2796 for the 6.7" size and 1242×2688
for 6.5"; the single existing capture is a help-page thumbnail. These need a simulator run,
which is a Mac job — the CI machine that builds for TestFlight could take them, which is
the cheapest route if nobody has a Mac at hand.

Worth showing, in this order: the apiary list, one hive with its history, the inspection
form with the frame buttons, the hornet map. The offline state is worth a shot too, with
the pending marker visible — it is the feature most likely to decide a download.
