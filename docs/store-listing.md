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
No advertising, no tracking for advertising, and nothing about you is sold or passed on. The project is open source. If you would like to support it there is a way to, and nothing in the app is locked behind it.

Bees do not read release notes. The app tries to stay out of the way while you work.
```
(1883)

**de**
```
HivePulse macht aus einer Durchsicht eine halbe Minute Tippen.

Kleb einen QR-Code auf jedes Volk. Scannen, und die App öffnet genau dieses Volk — kein Scrollen durch eine Liste mit kalten Händen. Erfasse, was du gesehen hast: Brut- und Honigwaben, Königin gesehen, Sanftmut, Varroa-Zahl, Behandlungen, Futter, eigene Notizen. Zahlen von 0 bis 10 sind große Knöpfe statt winziger Pfeile, damit das Formular auch mit Handschuhen funktioniert.

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
Keine Werbung, keine Verfolgung für Werbung, und nichts über dich wird verkauft oder weitergegeben. Das Projekt ist Open Source. Wer es unterstützen möchte, kann das — und keine Funktion der App hängt davon ab.

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
Aucune publicité, aucun pistage publicitaire, et rien de vous n'est vendu ni transmis. Le projet est open source. Qui veut le soutenir peut le faire, et aucune fonction n'en dépend.

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
Un seguimiento de Vespa velutina: informa de una captura, un nido o un avistamiento con foto, mira qué han informado otros cerca de ti y lleva tus propias trampas con nombre y recuento diario. Los avisos con foto los revisa la comunidad, porque una avispa se confunde con facilidad.

PRIVADO POR DEFECTO
Tus colmenares son privados. Si colocas uno en el mapa público, aparece a escala de municipio y nunca en tus coordenadas exactas: la idea es mostrar la actividad apícola, no las ubicaciones. Puedes desactivarlo cuando quieras.

SIN ANUNCIOS NI VENTA DE DATOS
Sin publicidad, sin rastreo publicitario, y nada sobre ti se vende ni se cede. El proyecto es de código abierto. Quien quiera apoyarlo puede hacerlo, y ninguna función depende de eso.

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
Żadnych reklam, żadnego śledzenia reklamowego i nic o Tobie nie jest sprzedawane ani przekazywane. Projekt jest open source. Kto chce go wesprzeć, może to zrobić, a żadna funkcja aplikacji od tego nie zależy.

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
apicultura,colmena,colmenar,revision,varroa,reina,avispa,velutina,miel,enjambre,cuaderno
```
(88)

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

The release this describes is **1.0.3**. It is the App Store's release notes; Play takes its own
from `distribution/whatsnew/` during the automated upload, and those are Android's four lines, not
these. Keep the two apart: a fix that only happened on one platform belongs only in that
platform's notes.

**en**
```
The scan tab opens the camera the moment you reach it — there used to be a page with a button and the scanner behind it in a sheet, which is one tap too many at the hive with gloves on. What that page said is now drawn over the preview, inside an amber frame to aim with.

A sign-in that was refused says what was wrong again. It used to say "Session expired. Please sign in again", which was not true and asked you to do the thing you had just done. Behind it sat a larger fault: the app read the server's error messages from the wrong field, so every refused action — a name already taken, a form it would not accept, a hive that no longer exists — came out as "Unknown error".

The colony mood no longer appears in English on a German, French, Spanish or Polish page.

The German texts now say "du" throughout. A dozen screens had said "Sie", often one screen after another.

And the version number in Settings and TestFlight is the real one: every build so far called itself 1.0.0.
```

**de**
```
Der Scan-Reiter öffnet die Kamera, sobald du ihn erreichst — vorher war dort eine Seite mit einem Knopf und der Scanner dahinter in einem Blatt, was am Volk mit Handschuhen ein Tipp zu viel ist. Was die Seite sagte, steht jetzt über der Vorschau, in einem amberfarbenen Rahmen zum Zielen.

Eine abgelehnte Anmeldung sagt wieder, was falsch war. Vorher stand da „Sitzung abgelaufen. Bitte erneut anmelden", was nicht stimmte und genau das verlangte, was man gerade getan hatte. Dahinter lag ein größerer Fehler: die App las die Fehlermeldungen des Servers aus dem falschen Feld, also kam jede abgelehnte Handlung — ein Name, der schon vergeben ist, ein Formular, das so nicht angenommen wird, ein Volk, das es nicht mehr gibt — als „Unbekannter Fehler" heraus.

Die Stimmung des Volkes steht nicht länger englisch auf einer deutschen, französischen, spanischen oder polnischen Seite.

Die deutschen Texte sagen jetzt durchweg „du". Auf einem Dutzend Bildschirmen stand „Sie", oft direkt hintereinander.

Und die Versionsnummer in den Einstellungen und in TestFlight ist die richtige: jeder Build nannte sich bisher 1.0.0.
```

**fr**
```
L'onglet de scan ouvre la caméra dès que vous y arrivez — il y avait avant une page avec un bouton et le scanner derrière, dans une feuille, ce qui fait un geste de trop à la ruche avec des gants. Ce que disait cette page est désormais dessiné par-dessus l'aperçu, dans un cadre ambre pour viser.

Une connexion refusée dit à nouveau ce qui n'allait pas. Elle disait « Session expirée. Veuillez vous reconnecter », ce qui était faux et demandait exactement ce que vous veniez de faire. Derrière se cachait un défaut plus large : l'application lisait les messages d'erreur du serveur dans le mauvais champ, et toute action refusée — un nom déjà pris, un formulaire rejeté, une ruche qui n'existe plus — ressortait en « Erreur inconnue ».

L'humeur de la colonie n'apparaît plus en anglais sur une page allemande, française, espagnole ou polonaise.

Les textes allemands emploient désormais le tutoiement partout.

Et le numéro de version dans les réglages et dans TestFlight est le bon : jusqu'ici, chaque version s'appelait 1.0.0.
```

**es**
```
La pestaña de escaneo abre la cámara en cuanto llegas a ella — antes había una página con un botón y el escáner detrás, en una hoja, lo que supone un toque de más en el colmenar con guantes. Lo que decía esa página se dibuja ahora sobre la vista previa, dentro de un marco ámbar para apuntar.

Un inicio de sesión rechazado vuelve a decir qué falló. Antes decía «Sesión caducada. Vuelve a iniciar sesión», que no era cierto y pedía justo lo que acababas de hacer. Detrás había un fallo mayor: la aplicación leía los mensajes de error del servidor del campo equivocado, así que toda acción rechazada — un nombre ya tomado, un formulario que no se acepta, una colmena que ya no existe — salía como «Error desconocido».

El humor de la colonia ya no aparece en inglés en una página alemana, francesa, española o polaca.

Los textos alemanes ahora tutean en todas partes.

Y el número de versión en los ajustes y en TestFlight es el real: hasta ahora cada compilación se llamaba 1.0.0.
```

**pl**
```
Zakładka skanowania otwiera aparat w chwili, gdy do niej przejdziesz — wcześniej była tam strona z przyciskiem, a skaner za nią, w arkuszu, co w pasiece w rękawicach oznacza jedno dotknięcie za dużo. To, co mówiła ta strona, jest teraz narysowane na podglądzie, w bursztynowej ramce do celowania.

Odrzucone logowanie znów mówi, co było nie tak. Wcześniej pisało „Sesja wygasła. Zaloguj się ponownie", co nie było prawdą i żądało dokładnie tego, co właśnie zrobiłeś. Za tym stał większy błąd: aplikacja czytała komunikaty błędów serwera z niewłaściwego pola, więc każde odrzucone działanie — zajęta nazwa, formularz, który nie zostaje przyjęty, rodzina, której już nie ma — wychodziło jako „Nieznany błąd".

Nastrój rodziny nie pojawia się już po angielsku na niemieckiej, francuskiej, hiszpańskiej ani polskiej stronie.

Teksty niemieckie zwracają się teraz wszędzie na „du".

A numer wersji w ustawieniach i w TestFlight jest prawdziwy: do tej pory każda kompilacja nazywała się 1.0.0.
```

---

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
