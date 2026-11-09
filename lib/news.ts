// News feed entries, newest first. Every entry carries its text in all five site locales;
// app/[locale]/news/page.tsx picks the one matching the current locale.

export type NewsLocale = 'en' | 'de' | 'fr' | 'es' | 'pl';
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
    date: '2026-11-10',
    tag: 'fix',
    text: {
      en: {
        title: 'Nine Words That Were Never Read Aloud',
        body: 'Somebody said the French looked wrong in places. We went looking, and found something more interesting than the thing we were sent after. Nine Spanish strings said “colmenas e revisiones”. In Spanish the word for “and” becomes “e” only before an i sound; before “revisiones” it has to be “y”. It reads to a Spanish beekeeper the way “a apple” reads in English — not a mystery, just wrong, in nine places across the website, Android and the iPhone. The French reminder settings said “Rappels d’visite” twice, which is the same kind of wrong. Both came from the same small act: somebody replaced the word for an inspection and left the word in front of it alone. The replacement was careful about the thing it was changing and blind to what it was standing next to. No check could see any of it. Our translation checker compares keys, looks for empty values, and matches the placeholders — and every one of those nine keys existed, was filled, had no placeholders, and was genuinely in Spanish. Nothing was missing. It was simply not grammatical, and nothing in the repository reads a sentence as a sentence. Two of these rules, though, are mechanical: whether Spanish takes “y” or “e” depends only on the sound that follows, and the same is true of the French “de” and “d’”. So they are checked now, and the check is tested with the real broken lines and with the correct ones that must stay quiet — “red e inténtalo” is right and has to pass, because a guard that cries wolf gets switched off. The bigger find came from asking a different question. Instead of comparing keys, we compared the English: 191 strings show the identical English sentence on both Android and the iPhone. In 109 of them the German, French or Spanish differed. Some were harmless — one app said “Meldung senden” and the other “Meldung absenden”. Some were not. The iPhone’s Spanish called a hornet a wasp, as the title of a whole tab, in an app about one hornet species. German used “Durchsicht” where the project’s own vocabulary says “Kontrolle”. And the one we liked best: each app contradicted itself about whether a frame of brood is a comb or a wooden frame — Android said one on the inspection form and the other in the community statistics, and the iPhone said it the other way round. Polish, across all 191, had not a single difference. That is the reason this was worth a day rather than an excuse: one language had been done consistently, so it was possible. The keys are named differently on each platform (`hornet_title` against `hornets.title`), which is exactly why no key-based check could ever have seen this; matching on the English needs no mapping at all. That comparison now runs in CI with an empty exception list, and the list is meant to stay empty: every entry in it would be wording a beekeeper reads differently on their phone than on someone else’s.',
      },
      de: {
        title: 'Neun Wörter, die nie jemand vorgelesen hat',
        body: 'Es hieß, das Französische sehe stellenweise falsch aus. Wir haben nachgesehen und etwas Interessanteres gefunden als das, wonach wir geschickt wurden. Neun spanische Strings sagten „colmenas e revisiones“. Im Spanischen wird „und“ nur vor einem i-Laut zu „e“; vor „revisiones“ muss „y“ stehen. Für einen spanischen Imker liest sich das wie „a apple“ auf Englisch — kein Rätsel, einfach falsch, an neun Stellen auf der Website, auf Android und auf dem iPhone. Die französischen Erinnerungs-Einstellungen sagten zweimal „Rappels d’visite“, und das ist dieselbe Art von falsch. Beides kam aus derselben kleinen Handlung: jemand hat das Wort für eine Kontrolle ersetzt und das Wort davor stehen gelassen. Die Ersetzung war sorgfältig mit dem, was sie änderte, und blind für das, wonebenstand. Keine Prüfung konnte das sehen. Unser Übersetzungsprüfer vergleicht Schlüssel, sucht leere Werte und gleicht die Platzhalter ab — und jeder dieser neun Schlüssel war vorhanden, gefüllt, ohne Platzhalter und tatsächlich spanisch. Es fehlte nichts. Es war nur nicht richtig, und nichts im Repository liest einen Satz als Satz. Zwei dieser Regeln sind aber mechanisch: ob Spanisch „y“ oder „e“ nimmt, hängt nur vom folgenden Laut ab, und für das französische „de“ und „d’“ gilt dasselbe. Also werden sie jetzt geprüft, und die Prüfung wird selbst geprüft — mit den echten kaputten Zeilen und mit den richtigen, die stumm bleiben müssen. „red e inténtalo“ ist korrekt und muss durchgehen, denn ein Schutz, der grundlos anschlägt, wird abgeschaltet. Der größere Fund kam von einer anderen Frage. Statt Schlüssel zu vergleichen, haben wir das Englische verglichen: 191 Strings zeigen in Android und auf dem iPhone denselben englischen Satz. In 109 davon unterschieden sich Deutsch, Französisch oder Spanisch. Manches war harmlos — eine App sagte „Meldung senden“, die andere „Meldung absenden“. Manches nicht. Das spanische iPhone nannte eine Hornisse eine Wespe, als Titel eines ganzen Reiters, in einer App über eine Hornissenart. Deutsch sagte „Durchsicht“, wo die Vokabel des Projekts „Kontrolle“ vorschreibt. Und das Schönste: jede App widersprach sich selbst, ob eine Brutwabe eine Wabe oder ein Rähmchen ist — Android sagte im Kontrollformular das eine und in der Gemeinschaftsstatistik das andere, das iPhone genau umgekehrt. Polnisch hatte über alle 191 hinweg keine einzige Abweichung. Das ist der Grund, warum sich dafür ein Tag lohnt und keine Entschuldigung: eine Sprache war durchgehend sorgfältig gemacht, es ist also möglich. Die Schlüssel heißen auf jeder Plattform anders (`hornet_title` gegen `hornets.title`), und genau deshalb hätte keine schlüsselbasierte Prüfung das je sehen können; über das Englische zu vergleichen braucht überhaupt keine Zuordnung. Dieser Vergleich läuft jetzt in CI, mit einer leeren Ausnahmeliste, und die soll leer bleiben: jeder Eintrag darin wäre Wortlaut, den ein Imker auf seinem Telefon anders liest als auf einem anderen.',
      },
      fr: {
        title: 'Neuf mots que personne n’avait lus à voix haute',
        body: 'On nous a dit que le français semblait faux par endroits. Nous avons cherché, et trouvé plus intéressant que ce pour quoi on nous envoyait. Neuf chaînes espagnoles disaient « colmenas e revisiones ». En espagnol, « et » devient « e » uniquement devant un son i ; devant « revisiones » il faut « y ». Pour un apiculteur espagnol, cela se lit comme « a apple » en anglais — pas une énigme, simplement faux, à neuf endroits sur le site, sur Android et sur iPhone. Les réglages de rappels en français disaient deux fois « Rappels d’visite », même genre de faute. Les deux viennent du même petit geste : quelqu’un a remplacé le mot désignant une visite et laissé celui qui le précède. Le remplacement était soigneux sur ce qu’il changeait et aveugle à ce qui se trouvait à côté. Aucun contrôle ne pouvait le voir. Notre vérificateur compare les clés, cherche les valeurs vides et aligne les variables — et chacune de ces neuf clés existait, était remplie, sans variable, et bien en espagnol. Rien ne manquait. Ce n’était simplement pas correct, et rien dans le dépôt ne lit une phrase comme une phrase. Deux de ces règles sont pourtant mécaniques : le choix entre « y » et « e » ne dépend que du son qui suit, et il en va de même pour « de » et « d’ ». Elles sont donc vérifiées désormais, et la vérification est elle-même testée — avec les vraies lignes fautives et avec les correctes qui doivent rester muettes, car une protection qui crie au loup finit débranchée. La plus grande trouvaille vient d’une autre question. Au lieu de comparer les clés, nous avons comparé l’anglais : 191 chaînes affichent la même phrase anglaise sur Android et sur iPhone. Dans 109 d’entre elles, l’allemand, le français ou l’espagnol différait. Certaines sans conséquence. D’autres non : l’espagnol de l’iPhone appelait un frelon une guêpe, comme titre d’un onglet entier, dans une application consacrée à une espèce de frelon. Et notre préférée : chaque application se contredisait sur la nature d’un cadre de couvain, chacune dans l’autre sens. Le polonais, sur les 191, n’avait pas une seule différence — et c’est bien pour cela que cela méritait une journée plutôt qu’une excuse : une langue avait été faite avec constance, donc c’était possible. Les clés portent des noms différents selon la plateforme, ce qui explique qu’aucun contrôle par clé ne pouvait voir cela ; comparer l’anglais ne demande aucune correspondance. Cette comparaison tourne maintenant en intégration continue, avec une liste d’exceptions vide, et elle doit le rester.',
      },
      es: {
        title: 'Nueve palabras que nadie leyó en voz alta',
        body: 'Nos dijeron que el francés parecía mal en algunos sitios. Fuimos a mirar y encontramos algo más interesante que aquello a lo que nos enviaban. Nueve cadenas en español decían «colmenas e revisiones». En español la «e» sustituye a la «y» solo ante sonido i; ante «revisiones» tiene que ser «y». A un apicultor español le suena como «a apple» en inglés — no un misterio, simplemente mal, en nueve sitios entre la web, Android y el iPhone. Los ajustes de recordatorios en francés decían dos veces «Rappels d’visite», el mismo tipo de error. Ambos vienen del mismo gesto pequeño: alguien sustituyó la palabra para una revisión y dejó la de delante. La sustitución fue cuidadosa con lo que cambiaba y ciega a lo que tenía al lado. Ninguna comprobación podía verlo. Nuestro verificador compara claves, busca valores vacíos y cuadra los marcadores — y cada una de esas nueve claves existía, estaba rellena, sin marcadores y en español de verdad. No faltaba nada. Simplemente no era correcto, y nada en el repositorio lee una frase como una frase. Dos de esas reglas, sin embargo, son mecánicas: la elección entre «y» y «e» depende solo del sonido que sigue, y lo mismo vale para el francés «de» y «d’». Así que ahora se comprueban, y la comprobación se prueba a sí misma — con las líneas realmente rotas y con las correctas que deben seguir calladas, porque una protección que da falsas alarmas se acaba apagando. El hallazgo mayor vino de otra pregunta. En vez de comparar claves, comparamos el inglés: 191 cadenas muestran la misma frase inglesa en Android y en el iPhone. En 109 de ellas el alemán, el francés o el español diferían. Algunas sin importancia. Otras no: el español del iPhone llamaba avispa a un avispón, como título de una pestaña entera, en una aplicación sobre una especie de avispón. Y la que más nos gustó: cada aplicación se contradecía sobre qué es un cuadro de cría, cada una al revés de la otra. El polaco, entre las 191, no tenía ni una diferencia — y por eso mereció un día y no una excusa: un idioma se había hecho con constancia, así que era posible. Las claves se llaman distinto en cada plataforma, y justo por eso ninguna comprobación por clave podía verlo; comparar el inglés no necesita ninguna correspondencia. Esa comparación corre ya en integración continua, con una lista de excepciones vacía, y vacía debe quedarse.',
      },
      pl: {
        title: 'Dziewięć słów, których nikt nie przeczytał na głos',
        body: 'Powiedziano nam, że francuski miejscami wygląda źle. Poszliśmy sprawdzić i znaleźliśmy coś ciekawszego niż to, po co nas wysłano. Dziewięć hiszpańskich napisów mówiło „colmenas e revisiones”. W hiszpańskim „i” przybiera formę „e” tylko przed dźwiękiem i; przed „revisiones” musi być „y”. Dla hiszpańskiego pszczelarza brzmi to jak „a apple” po angielsku — nie zagadka, po prostu błąd, w dziewięciu miejscach na stronie, w Androidzie i na iPhonie. Francuskie ustawienia przypomnień dwukrotnie mówiły „Rappels d’visite” — ten sam rodzaj błędu. Oba wzięły się z tego samego małego ruchu: ktoś zamienił słowo oznaczające przegląd i zostawił to, które stoi przed nim. Zamiana była staranna wobec tego, co zmieniała, i ślepa na to, co stało obok. Żadna kontrola nie mogła tego zobaczyć. Nasz weryfikator porównuje klucze, szuka pustych wartości i zestawia symbole zastępcze — a każdy z tych dziewięciu kluczy istniał, był wypełniony, nie miał symboli i był naprawdę po hiszpańsku. Nic nie brakowało. Po prostu nie było poprawne, a nic w repozytorium nie czyta zdania jako zdania. Dwie z tych reguł są jednak mechaniczne: wybór między „y” i „e” zależy tylko od następującego dźwięku, i to samo dotyczy francuskiego „de” i „d’”. Więc teraz są sprawdzane, a sama kontrola jest testowana — prawdziwymi zepsutymi liniami i tymi poprawnymi, które muszą milczeć, bo zabezpieczenie siejące fałszywe alarmy zostaje wyłączone. Większe znalezisko przyszło z innego pytania. Zamiast porównywać klucze, porównaliśmy angielski: 191 napisów pokazuje to samo angielskie zdanie w Androidzie i na iPhonie. W 109 z nich niemiecki, francuski lub hiszpański się różnił. Część nieszkodliwie. Część nie: hiszpański na iPhonie nazywał szerszenia osą, jako tytuł całej zakładki, w aplikacji o jednym gatunku szerszenia. I to, co podobało nam się najbardziej: każda aplikacja sama sobie przeczyła, czym jest ramka z czerwiem — każda odwrotnie. Polski na 191 nie miał ani jednej różnicy — i właśnie dlatego warto było poświęcić na to dzień, a nie wymówkę: jeden język zrobiono konsekwentnie, więc było to możliwe. Klucze nazywają się inaczej na każdej platformie, i właśnie dlatego żadna kontrola po kluczach nie mogła tego dostrzec; porównanie po angielskim nie wymaga żadnego przypisania. To porównanie działa teraz w CI, z pustą listą wyjątków, i pusta ma pozostać.',
      },
    },
  },
  {
    date: '2026-11-09',
    tag: 'fix',
    text: {
      en: {
        title: 'The Sentence the Server Wrote',
        body: 'A tester wrote in that signing in with a wrong password showed “HTTP 401 Unauthorized”. We looked at all three clients before fixing anything, which is the rule, and found two different faults wearing the same coat. The website was fine: “Invalid email or password.” Android showed the raw status line. The iPhone showed something worse than useless — “Session expired. Please sign in again” — which was not true, nothing had expired, the password was simply wrong, and the sentence asked the reader to do the exact thing they had just done and been refused for. Android already owned the solution. There is a helper whose own comment reads that what a person should read is the server’s message and not “HTTP 409 Conflict”; the three authentication calls were the only ones in the app that did not go through it. The iPhone needed a distinction rather than a new sentence: a 401 while holding a token really does mean the session is over, and then the old wording is right; a 401 with no token means these credentials do not work, and the server has written a sentence about it. But the interesting part was underneath. The iPhone read the server’s error body looking for a field called “error”. The backend sends “detail” — it always has, because the framework wraps everything under that name and nothing renames it. So the message was not merely ignored at sign-in: it was empty on the iPhone for every refused request there has ever been. A name already taken, a form that would not validate, a hive that no longer exists — all of them arrived as “Unknown error”. No test noticed, because no test had ever asserted on the text of a message, and the mock sends the real shape, so the mock was right and the app was wrong against it. The root was a document. The API contract has said “error” since its first draft and the backend has never sent that. The website and Android were written against the wire and read “detail”; the iPhone was written against the document. We corrected the document, not the backend: two clients and their tests speak “detail”, and renaming the field to match a sentence would break working software to make a paragraph true.',
      },
      de: {
        title: 'Der Satz, den der Server geschrieben hat',
        body: 'Ein Tester schrieb, dass eine Anmeldung mit falschem Passwort „HTTP 401 Unauthorized“ zeigt. Wir haben alle drei Clients angesehen, bevor etwas behoben wurde — so ist die Regel — und zwei verschiedene Fehler im selben Mantel gefunden. Die Website war in Ordnung: „Ungültige E-Mail oder Passwort.“ Android zeigte die rohe Statuszeile. Das iPhone zeigte etwas, das schlimmer ist als nutzlos — „Sitzung abgelaufen. Bitte erneut anmelden“ — was nicht stimmte, nichts war abgelaufen, das Passwort war einfach falsch, und der Satz forderte den Leser auf, genau das zu tun, was er gerade getan hatte und wofür er abgewiesen worden war. Android besaß die Lösung schon. Es gibt dort einen Helfer, in dessen eigenem Kommentar steht, dass ein Mensch die Meldung des Servers lesen soll und nicht „HTTP 409 Conflict“; die drei Anmelde-Aufrufe waren die einzigen in der App, die nicht hindurchgingen. Das iPhone brauchte keine neue Formulierung, sondern eine Unterscheidung: ein 401 mit Token heißt wirklich, dass die Sitzung vorbei ist, und dann stimmt der alte Satz; ein 401 ohne Token heißt, dass diese Zugangsdaten nicht gelten, und dazu hat der Server einen Satz geschrieben. Das Interessante lag aber darunter. Das iPhone las den Fehlerkörper des Servers und suchte darin ein Feld namens „error“. Das Backend sendet „detail“ — immer schon, weil das Framework alles unter diesem Namen einwickelt und nichts es umbenennt. Die Meldung wurde also nicht nur beim Anmelden übergangen: sie war auf dem iPhone bei jeder abgelehnten Anfrage leer, die es je gegeben hat. Ein Name, der schon vergeben ist, ein Formular, das nicht angenommen wird, ein Volk, das es nicht mehr gibt — alles kam als „Unbekannter Fehler“ an. Kein Test fiel darauf, weil nie ein Test den Text einer Meldung geprüft hat, und der Mock sendet die echte Form, der Mock hatte also recht und die App lag dagegen falsch. Die Wurzel war ein Dokument. Im API-Vertrag steht seit der ersten Fassung „error“, und das Backend hat das nie gesendet. Website und Android wurden gegen die Leitung geschrieben und lesen „detail“; das iPhone wurde gegen das Dokument geschrieben. Korrigiert haben wir das Dokument, nicht das Backend: zwei Clients und ihre Tests sprechen „detail“, und das Feld umzubenennen hieße, funktionierende Software zu brechen, damit ein Absatz stimmt.',
      },
      fr: {
        title: 'La phrase écrite par le serveur',
        body: 'Un testeur a signalé qu’une connexion avec un mauvais mot de passe affichait « HTTP 401 Unauthorized ». Nous avons examiné les trois clients avant de corriger quoi que ce soit — c’est la règle — et trouvé deux défauts différents sous le même manteau. Le site allait bien : « Adresse ou mot de passe invalide. » Android affichait la ligne de statut brute. L’iPhone affichait quelque chose de pire qu’inutile — « Session expirée. Veuillez vous reconnecter » — ce qui était faux, rien n’avait expiré, le mot de passe était simplement erroné, et la phrase demandait au lecteur de faire exactement ce qu’il venait de faire et pour quoi il venait d’être refusé. Android possédait déjà la solution. Il y existe un utilitaire dont le commentaire dit qu’une personne doit lire le message du serveur et non « HTTP 409 Conflict » ; les trois appels d’authentification étaient les seuls de l’application à ne pas y passer. L’iPhone n’avait pas besoin d’une nouvelle formule mais d’une distinction : un 401 avec jeton signifie vraiment que la session est terminée, et l’ancienne phrase est alors juste ; un 401 sans jeton signifie que ces identifiants ne valent pas, et le serveur a écrit une phrase à ce sujet. Mais l’intéressant était en dessous. L’iPhone lisait le corps d’erreur du serveur en y cherchant un champ nommé « error ». Le backend envoie « detail » — depuis toujours, parce que le cadriciel emballe tout sous ce nom et que rien ne le renomme. Le message n’était donc pas seulement ignoré à la connexion : il était vide sur iPhone pour toute requête refusée depuis le début. Un nom déjà pris, un formulaire rejeté, une ruche qui n’existe plus — tout arrivait en « Erreur inconnue ». Aucun test ne l’a vu, parce qu’aucun test n’avait jamais vérifié le texte d’un message, et le mock envoie la vraie forme : le mock avait raison et l’application avait tort face à lui. La racine était un document. Le contrat d’API dit « error » depuis sa première version, et le backend ne l’a jamais envoyé. Le site et Android ont été écrits contre le réseau et lisent « detail » ; l’iPhone a été écrit contre le document. Nous avons corrigé le document, pas le backend : deux clients et leurs tests parlent « detail », et renommer le champ reviendrait à casser un logiciel qui fonctionne pour rendre vrai un paragraphe.',
      },
      es: {
        title: 'La frase que escribió el servidor',
        body: 'Un probador avisó de que iniciar sesión con una contraseña incorrecta mostraba «HTTP 401 Unauthorized». Revisamos los tres clientes antes de arreglar nada — esa es la regla — y encontramos dos fallos distintos con el mismo abrigo. La web estaba bien: «Correo o contraseña no válidos.» Android mostraba la línea de estado en bruto. El iPhone mostraba algo peor que inútil — «Sesión caducada. Vuelve a iniciar sesión» — que no era cierto, nada había caducado, la contraseña estaba simplemente mal, y la frase pedía al lector hacer justo lo que acababa de hacer y por lo que acababa de ser rechazado. Android ya tenía la solución. Existe allí una función cuyo propio comentario dice que una persona debe leer el mensaje del servidor y no «HTTP 409 Conflict»; las tres llamadas de autenticación eran las únicas de la aplicación que no pasaban por ella. El iPhone no necesitaba una frase nueva sino una distinción: un 401 con token sí significa que la sesión terminó, y entonces la frase antigua es correcta; un 401 sin token significa que esas credenciales no sirven, y el servidor ha escrito una frase al respecto. Pero lo interesante estaba debajo. El iPhone leía el cuerpo de error del servidor buscando un campo llamado «error». El backend envía «detail» — siempre lo ha hecho, porque el marco envuelve todo con ese nombre y nada lo renombra. Así que el mensaje no se ignoraba solo al iniciar sesión: estaba vacío en el iPhone en cada petición rechazada que ha habido. Un nombre ya tomado, un formulario que no se acepta, una colmena que ya no existe — todo llegaba como «Error desconocido». Ninguna prueba lo vio, porque ninguna había comprobado nunca el texto de un mensaje, y el simulador envía la forma real: el simulador tenía razón y la aplicación estaba equivocada frente a él. La raíz era un documento. El contrato de la API dice «error» desde su primera versión, y el backend nunca lo ha enviado. La web y Android se escribieron contra el cable y leen «detail»; el iPhone se escribió contra el documento. Corregimos el documento, no el backend: dos clientes y sus pruebas hablan «detail», y renombrar el campo sería romper software que funciona para hacer verdadero un párrafo.',
      },
      pl: {
        title: 'Zdanie, które napisał serwer',
        body: 'Tester zgłosił, że logowanie z błędnym hasłem pokazuje „HTTP 401 Unauthorized”. Sprawdziliśmy wszystkie trzy klienty, zanim cokolwiek naprawiliśmy — taka jest zasada — i znaleźliśmy dwa różne błędy w tym samym płaszczu. Strona była w porządku: „Nieprawidłowy e-mail lub hasło.” Android pokazywał surową linię statusu. iPhone pokazywał coś gorszego niż bezużyteczne — „Sesja wygasła. Zaloguj się ponownie” — co nie było prawdą, nic nie wygasło, hasło było po prostu błędne, a zdanie żądało od czytającego dokładnie tego, co właśnie zrobił i za co został odrzucony. Android miał rozwiązanie od dawna. Jest tam pomocnik, w którego własnym komentarzu stoi, że człowiek ma czytać komunikat serwera, a nie „HTTP 409 Conflict”; trzy wywołania uwierzytelniania były jedynymi w aplikacji, które przez niego nie przechodziły. iPhone potrzebował nie nowego zdania, lecz rozróżnienia: 401 z tokenem naprawdę znaczy, że sesja się skończyła, i wtedy stare zdanie jest słuszne; 401 bez tokenu znaczy, że te dane nie działają, a serwer napisał o tym zdanie. Ale ciekawe leżało pod spodem. iPhone czytał ciało błędu serwera, szukając w nim pola o nazwie „error”. Backend wysyła „detail” — od zawsze, bo framework zawija wszystko pod tą nazwą i nic jej nie zmienia. Komunikat nie był więc pomijany tylko przy logowaniu: na iPhonie był pusty przy każdym odrzuconym żądaniu, jakie kiedykolwiek było. Zajęta nazwa, formularz, który nie zostaje przyjęty, rodzina, której już nie ma — wszystko przychodziło jako „Nieznany błąd”. Żaden test tego nie zauważył, bo żaden nigdy nie sprawdzał treści komunikatu, a mock wysyła prawdziwą formę: mock miał rację, a aplikacja wobec niego błąd. Korzeniem był dokument. W kontrakcie API od pierwszej wersji stoi „error”, a backend nigdy tego nie wysłał. Strona i Android zostały napisane wobec sieci i czytają „detail”; iPhone został napisany wobec dokumentu. Poprawiliśmy dokument, nie backend: dwa klienty i ich testy mówią „detail”, a zmiana nazwy pola oznaczałaby psucie działającego oprogramowania, by akapit stał się prawdą.',
      },
    },
  },
  {
    date: '2026-11-09',
    tag: 'fix',
    text: {
      en: {
        title: 'The Labels That Were Never Looked Up',
        body: 'The server stores a hive type as `top_bar` and a colony mood as `calm`. Four screens never looked up what those words should say to the reader. They took the value, swapped the underscore for a space, made the first letter a capital, and showed the result. In English that is indistinguishable from the real label, which is the whole reason it lasted: “Top Bar”, “Calm”, “White” looked finished to everyone who ever read the screen in English. In German the hive list said “Top Bar” while the edit dialog on the very same screen said “Oberträgerbeute”. The translations had existed from the beginning. What makes this one worth writing down is that we had found it before. The inspection form did it, and was fixed, and got a test. The iPhone’s inspection detail did it, and was fixed, and got a test. Both tests check that the words are translated — and they always were. Neither test can see whether a screen bothers to ask for them, so three more screens went on not asking with every test green. The tool that is supposed to catch missing translations could not see it either: it reads the source for English somebody typed, and nobody typed any. The label was built at run time out of something that arrived over the network. So the fix is not only the four screens. The checker now reads the views for the shape of the mistake rather than the strings for their presence, and it is itself tested with the four real lines that caused this, because a guard nobody has tried to break is not a guard. While we were in there: six labels on Android — hive type, forage, two hornet statuses, an advice label — were drawn as chips. A chip is a button. They rippled under a finger and did nothing, and a screen reader announced each one as something to activate. That is the same mistake as the scanner’s missing viewfinder, pointing the other way: there, something that should have been visible drew nothing; here, things that are not actions were drawn as actions. They are labels now, as they always were on the iPhone.',
      },
      de: {
        title: 'Die Beschriftungen, die nie nachgeschlagen wurden',
        body: 'Der Server speichert einen Beutentyp als `top_bar` und eine Volksstimmung als `calm`. Vier Bildschirme schlugen nie nach, was diese Wörter dem Leser sagen sollen. Sie nahmen den Wert, tauschten den Unterstrich gegen ein Leerzeichen, machten den ersten Buchstaben groß und zeigten das Ergebnis. Auf Englisch ist das von der echten Beschriftung nicht zu unterscheiden, und genau deshalb hielt es sich: „Top Bar“, „Calm“, „White“ sahen fertig aus für jeden, der den Bildschirm je auf Englisch gelesen hat. Auf Deutsch sagte die Volksliste „Top Bar“, während der Bearbeiten-Dialog auf demselben Bildschirm „Oberträgerbeute“ sagte. Die Übersetzungen gab es von Anfang an. Aufschreibenswert ist daran, dass wir das schon einmal gefunden hatten. Das Kontrollformular machte es, wurde behoben, bekam einen Test. Die iPhone-Kontrollansicht machte es, wurde behoben, bekam einen Test. Beide Tests prüfen, ob die Wörter übersetzt sind — und das waren sie immer. Keiner der beiden kann sehen, ob ein Bildschirm sich die Mühe macht, danach zu fragen, also fragten drei weitere einfach weiter nicht, bei lauter grünen Tests. Das Werkzeug, das fehlende Übersetzungen finden soll, sah es ebenso wenig: es liest den Quelltext nach Englisch, das jemand getippt hat, und getippt hatte es niemand. Die Beschriftung entstand zur Laufzeit aus etwas, das übers Netz kam. Die Korrektur sind deshalb nicht nur die vier Bildschirme. Der Prüfer liest die Ansichten jetzt nach der Form des Fehlers statt die Textdateien nach dem Vorhandensein der Wörter, und er wird selbst mit den vier echten Zeilen geprüft, die das hier verursacht haben — ein Schutz, den nie jemand zu brechen versucht hat, ist kein Schutz. Wo wir schon dabei waren: sechs Beschriftungen auf Android — Beutentyp, Tracht, zwei Hornissen-Status, ein Hinweis-Etikett — waren als Chips gezeichnet. Ein Chip ist eine Schaltfläche. Sie reagierten unter dem Finger und taten nichts, und die Sprachausgabe kündigte jede als etwas zum Auslösen an. Das ist derselbe Fehler wie der fehlende Sucher im Scanner, nur andersherum: dort malte etwas nichts, das sichtbar sein sollte; hier wurde als Handlung gezeichnet, was keine ist. Jetzt sind es Beschriftungen, so wie auf dem iPhone immer schon.',
      },
      fr: {
        title: 'Les libellés que personne ne consultait',
        body: 'Le serveur enregistre un type de ruche comme `top_bar` et une humeur de colonie comme `calm`. Quatre écrans n’ont jamais consulté ce que ces mots devaient dire au lecteur. Ils prenaient la valeur, remplaçaient le tiret bas par une espace, mettaient une majuscule et affichaient le résultat. En anglais, c’est indiscernable du vrai libellé, et c’est exactement pourquoi cela a duré : « Top Bar », « Calm », « White » semblaient finis à quiconque lisait l’écran en anglais. En allemand, la liste des ruches disait « Top Bar » tandis que la boîte d’édition du même écran disait « Oberträgerbeute ». Les traductions existaient depuis le début. Ce qui mérite d’être noté, c’est que nous l’avions déjà trouvé. Le formulaire de visite le faisait, a été corrigé, a reçu un test. Le détail de visite sur iPhone le faisait, a été corrigé, a reçu un test. Les deux tests vérifient que les mots sont traduits — et ils l’ont toujours été. Aucun ne voit si un écran prend la peine de les demander, et trois autres écrans ont donc continué à ne pas le faire, tous tests au vert. L’outil censé repérer les traductions manquantes ne le voyait pas non plus : il lit le code à la recherche d’anglais tapé par quelqu’un, et personne n’en avait tapé. Le libellé était fabriqué à l’exécution à partir de ce qui arrivait par le réseau. La correction ne se limite donc pas aux quatre écrans. Le vérificateur lit désormais les vues pour y trouver la forme de l’erreur, plutôt que les fichiers de textes pour y trouver les mots, et il est lui-même testé avec les quatre vraies lignes à l’origine de tout ceci : une protection que personne n’a tenté de briser n’en est pas une. Pendant que nous y étions : six libellés sur Android — type de ruche, miellée, deux statuts de frelon, une étiquette de conseil — étaient dessinés comme des chips. Une chip est un bouton. Ils réagissaient sous le doigt sans rien faire, et un lecteur d’écran annonçait chacun comme une action. C’est la même erreur que le viseur absent du scanner, dans l’autre sens : là, une chose qui devait être visible ne dessinait rien ; ici, des choses qui ne sont pas des actions étaient dessinées comme telles. Ce sont désormais des libellés, comme sur iPhone depuis toujours.',
      },
      es: {
        title: 'Las etiquetas que nunca se consultaron',
        body: 'El servidor guarda un tipo de colmena como `top_bar` y un humor de colonia como `calm`. Cuatro pantallas nunca consultaron qué debían decir esas palabras al lector. Tomaban el valor, cambiaban el guión bajo por un espacio, ponían la primera letra en mayúscula y mostraban el resultado. En inglés eso es indistinguible de la etiqueta real, y por eso mismo duró tanto: «Top Bar», «Calm», «White» parecían acabados a cualquiera que leyera la pantalla en inglés. En alemán la lista de colmenas decía «Top Bar» mientras el diálogo de edición de la misma pantalla decía «Oberträgerbeute». Las traducciones existían desde el principio. Lo que hace que valga la pena anotarlo es que ya lo habíamos encontrado antes. El formulario de revisión lo hacía, se corrigió, recibió una prueba. El detalle de revisión del iPhone lo hacía, se corrigió, recibió una prueba. Ambas pruebas comprueban que las palabras estén traducidas — y siempre lo estuvieron. Ninguna ve si una pantalla se molesta en pedirlas, así que otras tres siguieron sin pedirlas con todas las pruebas en verde. La herramienta que debería detectar traducciones ausentes tampoco lo veía: lee el código buscando inglés que alguien escribió, y nadie escribió ninguno. La etiqueta se construía en tiempo de ejecución con algo que llegaba por la red. Así que el arreglo no son solo las cuatro pantallas. El verificador lee ahora las vistas buscando la forma del error en lugar de los textos buscando su presencia, y está probado él mismo con las cuatro líneas reales que lo causaron: una protección que nadie ha intentado romper no es una protección. Ya que estábamos: seis etiquetas en Android — tipo de colmena, floración, dos estados de avispa, una etiqueta de consejo — estaban dibujadas como chips. Un chip es un botón. Respondían bajo el dedo sin hacer nada, y un lector de pantalla anunciaba cada uno como algo que activar. Es el mismo error que el visor ausente del escáner, al revés: allí algo que debía verse no dibujaba nada; aquí, cosas que no son acciones se dibujaban como acciones. Ahora son etiquetas, como siempre lo fueron en el iPhone.',
      },
      pl: {
        title: 'Etykiety, do których nikt nie sięgał',
        body: 'Serwer zapisuje typ ula jako `top_bar`, a nastrój rodziny jako `calm`. Cztery ekrany nigdy nie sprawdziły, co te słowa mają mówić czytelnikowi. Brały wartość, zamieniały podkreślnik na spację, podnosiły pierwszą literę i pokazywały wynik. Po angielsku jest to nie do odróżnienia od prawdziwej etykiety i właśnie dlatego przetrwało: „Top Bar”, „Calm”, „White” wyglądały na gotowe dla każdego, kto czytał ekran po angielsku. Po niemiecku lista rodzin mówiła „Top Bar”, podczas gdy okno edycji na tym samym ekranie mówiło „Oberträgerbeute”. Tłumaczenia istniały od początku. Warte zapisania jest to, że już kiedyś to znaleźliśmy. Formularz przeglądu tak robił, został poprawiony, dostał test. Szczegóły przeglądu na iPhonie tak robiły, zostały poprawione, dostały test. Oba testy sprawdzają, czy słowa są przetłumaczone — a zawsze były. Żaden nie widzi, czy ekran w ogóle o nie pyta, więc trzy kolejne dalej nie pytały, przy wszystkich testach na zielono. Narzędzie, które ma wykrywać brakujące tłumaczenia, też tego nie widziało: czyta kod w poszukiwaniu angielszczyzny, którą ktoś wpisał, a nikt jej nie wpisał. Etykieta powstawała w czasie działania z czegoś, co przyszło przez sieć. Poprawka to zatem nie tylko cztery ekrany. Kontroler czyta teraz widoki w poszukiwaniu kształtu błędu, a nie plików tekstowych w poszukiwaniu słów, i sam jest sprawdzany czterema prawdziwymi liniami, które to spowodowały: zabezpieczenie, którego nikt nie próbował złamać, nie jest zabezpieczeniem. Przy okazji: sześć etykiet na Androidzie — typ ula, pożytek, dwa statusy szerszeń, etykieta porady — narysowano jako chipy. Chip to przycisk. Reagowały pod palcem i nic nie robiły, a czytnik ekranu zapowiadał każdą jako coś do uruchomienia. To ten sam błąd co brakujący celownik skanera, tylko odwrotnie: tam coś, co miało być widoczne, nie rysowało nic; tu rzeczy, które nie są działaniami, narysowano jako działania. Teraz są etykietami, tak jak na iPhonie od zawsze.',
      },
    },
  },
  {
    date: '2026-11-09',
    tag: 'fix',
    text: {
      en: {
        title: 'A Frame That Was Never There',
        body: 'The scan screen on Android opened the camera and showed you what it saw. That was all it did. No frame to hold the code inside, no sentence saying what it wanted — just a live picture under a title bar, and a beekeeper standing at a hive with gloves on, guessing how close to hold the phone. The iPhone has said “Scan the QR code on your hive to open its record or set it up for the first time” since the first release. Android said nothing. What makes this worth writing down is where the frame turned out to be. It was in the code, in the right place, with a comment above it calling it the viewfinder. It was drawn as a surface in a colour with its opacity set to zero, and its contents were empty. So it took up the correct space in the correct layer and painted nothing at all, on every phone, in every release. Nothing failed. No test went red, because a test that checks whether something is present would have found it present. The help pages have been captioning a picture of it in five languages the whole time, and that picture had been taken by hand in June, before the redesign, and showed a navigation bar with three tabs where the app now has five. Two mistakes that each hid the other: the screenshot was too old to show that the frame was missing, and the frame was too invisible for anyone to notice the screenshot was wrong. Both are fixed, and the picture is now taken by the same script that takes the others, which is the only part of this that stops it happening again. While we were in the German strings we found the iPhone app addressing people formally on twelve screens and informally on the rest — it now says du throughout, like the website and the Android app always have. And the screen itself: on the iPhone the Scan tab used to be a page with a large glyph, the same sentence and an amber button, with the scanner behind it in a sheet. Kinder, and one tap too many — at the hive, in gloves, opening the tab is itself the request to scan. It now opens the camera, as Android always did, and what the page said is drawn over the preview, so nothing is lost but the tap. The help pages had been describing it that way for months: “Tap the scan icon. Point at the hive label.” The iPhone was the one screen not following its own instructions.',
      },
      de: {
        title: 'Ein Rahmen, den es nie gab',
        body: 'Der Scan-Bildschirm auf Android öffnete die Kamera und zeigte dir, was sie sieht. Mehr tat er nicht. Kein Rahmen, in den der Code gehört, kein Satz, der sagt, was er will — nur ein Livebild unter einer Titelleiste, und davor ein Imker mit Handschuhen, der rät, wie nah er das Telefon halten soll. Das iPhone sagt seit der ersten Fassung „Scanne den QR-Code auf deinem Volk, um die Akte zu öffnen oder es erstmalig einzurichten.“ Android sagte nichts. Aufschreibenswert ist, wo der Rahmen am Ende war. Er stand im Code, an der richtigen Stelle, mit einem Kommentar darüber, der ihn Sucher nennt. Gezeichnet war er als Fläche in einer Farbe mit Deckkraft null, und sein Inhalt war leer. Er belegte also den richtigen Platz in der richtigen Ebene und malte überhaupt nichts, auf jedem Telefon, in jeder Fassung. Nichts ist fehlgeschlagen. Kein Test wurde rot, denn ein Test, der prüft, ob etwas da ist, hätte es vorgefunden. Die Hilfeseiten beschriften seitdem in fünf Sprachen ein Bild davon, und dieses Bild war im Juni von Hand aufgenommen worden, vor dem Redesign, und zeigte eine Navigationsleiste mit drei Reitern, wo die App heute fünf hat. Zwei Fehler, von denen jeder den anderen verdeckte: das Bild war zu alt, um zu zeigen, dass der Rahmen fehlt, und der Rahmen war zu unsichtbar, als dass jemand bemerkt hätte, dass das Bild falsch ist. Beides ist behoben, und das Bild nimmt jetzt dasselbe Skript auf wie die anderen — das ist der einzige Teil daran, der verhindert, dass es wieder passiert. Als wir ohnehin in den deutschen Texten waren, fiel auf, dass die iPhone-App auf zwölf Bildschirmen siezt und auf dem Rest duzt. Sie duzt jetzt überall, so wie die Website und die Android-App es immer getan haben. Und der Bildschirm selbst: auf dem iPhone war der Scan-Reiter eine Seite mit großer Glyphe, demselben Satz und einem ambernen Knopf, den Scanner dahinter in einem Blatt. Freundlicher, und ein Tipp zu viel — am Volk, mit Handschuhen, ist das Öffnen des Reiters schon die Bitte zu scannen. Er öffnet jetzt die Kamera, wie Android es immer tat, und was die Seite sagte, steht über der Vorschau, es geht also nichts verloren außer dem Tipp. Die Hilfeseiten beschreiben es seit Monaten so: „Auf das Scan-Symbol tippen. Auf das Etikett der Beute halten.“ Das iPhone war der eine Bildschirm, der sich nicht an die eigene Anleitung hielt.',
      },
      fr: {
        title: 'Un cadre qui n’a jamais existé',
        body: 'L’écran de scan sur Android ouvrait la caméra et vous montrait ce qu’elle voyait. C’est tout ce qu’il faisait. Aucun cadre où placer le code, aucune phrase disant ce qu’il attendait — juste une image en direct sous une barre de titre, et devant elle un apiculteur ganté qui devine à quelle distance tenir le téléphone. L’iPhone dit depuis la première version : « Scannez le code QR sur votre ruche pour ouvrir sa fiche ou la configurer pour la première fois. » Android ne disait rien. Ce qui mérite d’être noté, c’est où se trouvait le cadre. Il était dans le code, au bon endroit, avec un commentaire au-dessus qui l’appelait le viseur. Il était dessiné comme une surface d’une couleur à opacité nulle, et son contenu était vide. Il occupait donc la bonne place dans la bonne couche et ne peignait rien du tout, sur tous les téléphones, dans toutes les versions. Rien n’a échoué. Aucun test n’est passé au rouge, car un test qui vérifie la présence d’un élément l’aurait trouvé présent. Les pages d’aide en légendent une image depuis tout ce temps, en cinq langues, et cette image avait été prise à la main en juin, avant la refonte, montrant une barre de navigation à trois onglets là où l’application en a cinq. Deux erreurs dont chacune masquait l’autre : l’image était trop ancienne pour montrer que le cadre manquait, et le cadre trop invisible pour qu’on remarque que l’image était fausse. Les deux sont corrigées, et l’image est désormais prise par le même script que les autres — la seule partie de tout cela qui empêche que cela recommence. Pendant que nous étions dans les textes allemands, nous avons trouvé l’application iPhone vouvoyant sur douze écrans et tutoyant sur les autres ; elle tutoie désormais partout, comme le site et l’application Android l’ont toujours fait. Et l’écran lui-même : sur iPhone, l’onglet Scan était une page avec un grand glyphe, la même phrase et un bouton ambre, le scanner derrière dans une feuille. Plus aimable, et une tape de trop — à la ruche, avec des gants, ouvrir l’onglet est déjà la demande de scanner. Il ouvre désormais la caméra, comme Android l’a toujours fait, et ce que disait la page est dessiné sur l’aperçu : rien n’est perdu, sauf la tape. Les pages d’aide le décrivaient ainsi depuis des mois : « Touchez l’icône de scan. Visez l’étiquette de la ruche. » L’iPhone était le seul écran à ne pas suivre son propre mode d’emploi.',
      },
      es: {
        title: 'Un marco que nunca estuvo ahí',
        body: 'La pantalla de escaneo en Android abría la cámara y te mostraba lo que veía. Eso era todo. Ningún marco donde colocar el código, ninguna frase que dijera qué quería — solo una imagen en directo bajo una barra de título, y delante un apicultor con guantes adivinando a qué distancia sostener el teléfono. El iPhone dice desde la primera versión: «Escanea el código QR en tu colmena para abrir su ficha o configurarla por primera vez». Android no decía nada. Lo que merece la pena anotar es dónde estaba el marco. Estaba en el código, en el sitio correcto, con un comentario encima que lo llamaba el visor. Estaba dibujado como una superficie de un color con opacidad cero, y su contenido estaba vacío. Ocupaba por tanto el espacio correcto en la capa correcta y no pintaba nada en absoluto, en todos los teléfonos, en todas las versiones. Nada falló. Ninguna prueba se puso en rojo, porque una prueba que comprueba si algo está presente lo habría encontrado presente. Las páginas de ayuda llevan todo este tiempo poniéndole pie a una imagen de él en cinco idiomas, y esa imagen se había tomado a mano en junio, antes del rediseño, y mostraba una barra de navegación con tres pestañas donde la aplicación tiene cinco. Dos errores que se ocultaban mutuamente: la imagen era demasiado antigua para mostrar que faltaba el marco, y el marco demasiado invisible para que alguien notara que la imagen estaba mal. Ambos están corregidos, y la imagen la toma ahora el mismo script que las demás — la única parte de todo esto que impide que vuelva a pasar. Ya que estábamos en los textos alemanes, encontramos la aplicación de iPhone tratando de usted en doce pantallas y de tú en el resto; ahora tutea en todas partes, como la web y la aplicación de Android han hecho siempre. Y la pantalla misma: en el iPhone la pestaña Escanear era una página con un glifo grande, la misma frase y un botón ámbar, con el escáner detrás en una hoja. Más amable, y un toque de más — en la colmena, con guantes, abrir la pestaña ya es la petición de escanear. Ahora abre la cámara, como Android siempre hizo, y lo que decía la página se dibuja sobre la vista previa, así que no se pierde nada salvo el toque. Las páginas de ayuda llevaban meses describiéndolo así: «Toca el icono de escanear. Apunta a la etiqueta de la colmena». El iPhone era la única pantalla que no seguía sus propias instrucciones.',
      },
      pl: {
        title: 'Ramka, której nigdy nie było',
        body: 'Ekran skanowania na Androidzie otwierał aparat i pokazywał, co widzi. Tylko tyle. Żadnej ramki, w którą należy wpasować kod, żadnego zdania mówiącego, czego oczekuje — po prostu obraz na żywo pod paskiem tytułu, a przed nim pszczelarz w rękawicach, zgadujący, jak blisko trzymać telefon. iPhone od pierwszej wersji mówi: „Zeskanuj kod QR na ulu, aby otworzyć jego wpis albo założyć go po raz pierwszy”. Android nie mówił nic. Warte zapisania jest to, gdzie ta ramka się znajdowała. Była w kodzie, we właściwym miejscu, z komentarzem nad nią nazywającym ją celownikiem. Narysowano ją jako powierzchnię w kolorze o zerowym kryciu, a jej zawartość była pusta. Zajmowała więc właściwe miejsce we właściwej warstwie i nie malowała zupełnie niczego — na każdym telefonie, w każdej wersji. Nic nie zawiodło. Żaden test nie zaświecił się na czerwono, bo test sprawdzający, czy coś istnieje, znalazłby to na miejscu. Strony pomocy przez cały ten czas podpisywały jej zdjęcie w pięciu językach, a to zdjęcie zrobiono ręcznie w czerwcu, przed przeprojektowaniem, i pokazywało pasek nawigacji z trzema zakładkami tam, gdzie aplikacja ma pięć. Dwa błędy, z których każdy zasłaniał drugi: zdjęcie było za stare, by pokazać brak ramki, a ramka zbyt niewidoczna, by ktoś zauważył, że zdjęcie jest błędne. Oba są naprawione, a zdjęcie wykonuje teraz ten sam skrypt co pozostałe — to jedyna część tej historii, która nie pozwoli jej się powtórzyć. Przy okazji niemieckich tekstów okazało się, że aplikacja na iPhone’a na dwunastu ekranach zwraca się formalnie, a na reszcie nieformalnie; teraz wszędzie mówi „du”, tak jak strona i aplikacja na Androida od zawsze. I sam ekran: na iPhonie zakładka Skanuj była stroną z dużym symbolem, tym samym zdaniem i bursztynowym przyciskiem, a skaner czekał za nią w arkuszu. Łagodniej, i o jedno dotknięcie za dużo — przy ulu, w rękawicach, otwarcie zakładki samo w sobie jest prośbą o skanowanie. Teraz otwiera aparat, jak Android od zawsze, a to, co mówiła strona, rysuje się nad podglądem — nie ginie nic poza dotknięciem. Strony pomocy opisywały to tak od miesięcy: „Dotknij ikony skanowania. Wyceluj w etykietę ula”. iPhone był jedynym ekranem, który nie trzymał się własnej instrukcji.',
      },
    },
  },
  {
    date: '2026-11-06',
    tag: 'feature',
    text: {
      en: {
        title: 'The Calendar Asks You Back',
        body: 'The 38 entries of the beekeeping year were written once, for central Germany, and moved everywhere else by a formula: so many days later per degree of latitude, so many per 100 metres of altitude. It is a reasonable formula and it is still a guess. Nobody has ever checked it against what beekeepers actually do in Andalusia, in Brittany or in Masuria. From today they can tell us. The questionnaire asks for a country and a postal code first, so the dates you rate are the dates you would really see, and then it goes through the year: it fits, it happens later here, it happens earlier here, it is not done here at all. Nobody is asked for a sign — "a fortnight later" is a direction and a number, and the form should not make a person work out which of them is negative. Nothing you leave alone is sent: silence is not agreement, and counting it as agreement would be the one way to make this worse than not asking. No account, and what is kept is thin: the country, a position rounded to about eleven kilometres, and your answers. The postal code is looked up once and then dropped. Your answer moves nothing by itself either. Ratings within 150 km of each other are grouped, a group needs five beekeepers before it is shown to anybody, and the correction is the median rather than the mean, so one strong opinion cannot carry a region. Then it waits for a person who knows that region. Both apps link to it from the year screen, in the list and in the picture, because the moment to say "not here" is while you are reading the dates.',
      },
      de: {
        title: 'Der Kalender fragt zurück',
        body: 'Die 38 Einträge des Imkerjahres wurden einmal geschrieben, für Mitteldeutschland, und mit einer Formel überall sonst hin verschoben: so viele Tage später je Breitengrad, so viele je 100 Höhenmeter. Es ist eine vernünftige Formel, und sie bleibt eine Schätzung. Niemand hat sie je mit dem verglichen, was Imker in Andalusien, in der Bretagne oder in Masuren wirklich tun. Ab heute können sie es uns sagen. Der Fragebogen fragt zuerst nach Land und Postleitzahl, damit die Daten, die du bewertest, die sind, die du wirklich sehen würdest, und geht dann das Jahr durch: passt, bei mir später, bei mir früher, gilt hier nicht. Nach einem Vorzeichen wird niemand gefragt — „zwei Wochen später" ist eine Richtung und eine Zahl, und ein Formular soll einen Menschen nicht ausrechnen lassen, welche davon negativ ist. Was du auslässt, wird nicht gesendet: Schweigen ist keine Zustimmung, und es als Zustimmung zu zählen wäre der eine Weg, das Ganze schlechter zu machen als gar nicht zu fragen. Kein Konto, und gespeichert wird wenig: das Land, eine auf etwa elf Kilometer gerundete Position und deine Antworten. Die Postleitzahl wird einmal nachgeschlagen und dann verworfen. Auch deine Antwort verschiebt allein nichts. Bewertungen im Umkreis von 150 km werden zusammengefasst, eine Gruppe braucht fünf Imker, bevor sie überhaupt jemandem gezeigt wird, und die Korrektur ist der Median und nicht der Mittelwert, damit eine kräftige Meinung keine Region tragen kann. Dann wartet sie auf einen Menschen, der diese Region kennt. Beide Apps verlinken ihn aus dem Jahresbildschirm, in der Liste wie im Bild, denn der Moment, „hier nicht" zu sagen, ist der, in dem man die Daten liest.',
      },
      fr: {
        title: 'Le calendrier vous interroge à son tour',
        body: 'Les 38 entrées de l’année apicole ont été écrites une fois, pour le centre de l’Allemagne, puis déplacées partout ailleurs par une formule : tant de jours plus tard par degré de latitude, tant par 100 mètres d’altitude. La formule est raisonnable et elle reste une estimation. Personne ne l’a jamais confrontée à ce que font vraiment les apiculteurs en Andalousie, en Bretagne ou en Mazurie. À partir d’aujourd’hui, ils peuvent nous le dire. Le questionnaire demande d’abord un pays et un code postal, afin que les dates évaluées soient celles que vous verriez réellement, puis il parcourt l’année : ça colle, plus tard ici, plus tôt ici, pas d’usage ici. On ne demande de signe à personne — « quinze jours plus tard », c’est une direction et un nombre, et un formulaire ne doit pas faire calculer à quelqu’un lequel des deux est négatif. Ce que vous laissez n’est pas envoyé : le silence n’est pas un accord, et le compter comme tel serait la seule manière de rendre l’exercice pire que de ne pas poser la question. Aucun compte, et peu de choses conservées : le pays, une position arrondie à environ onze kilomètres et vos réponses. Le code postal est recherché une fois puis abandonné. Votre réponse ne déplace rien à elle seule non plus. Les avis à moins de 150 km les uns des autres sont regroupés, un groupe a besoin de cinq apiculteurs avant d’être montré à qui que ce soit, et la correction est la médiane et non la moyenne, pour qu’un avis tranché ne porte pas une région. Elle attend ensuite une personne qui connaît cette région. Les deux applications y renvoient depuis l’écran de l’année, en liste comme en image, car le moment de dire « pas ici » est celui où l’on lit les dates.',
      },
      es: {
        title: 'El calendario te pregunta a ti',
        body: 'Las 38 entradas del año apícola se escribieron una vez, para el centro de Alemania, y se trasladaron a todas partes con una fórmula: tantos días más tarde por grado de latitud, tantos por cada 100 metros de altitud. Es una fórmula razonable y sigue siendo una estimación. Nadie la ha comparado nunca con lo que hacen de verdad los apicultores en Andalucía, en Bretaña o en Masuria. Desde hoy pueden decírnoslo. El cuestionario pide primero un país y un código postal, para que las fechas que valores sean las que verías realmente, y luego recorre el año: encaja, más tarde aquí, más temprano aquí, aquí no se hace. A nadie se le pide un signo: «dos semanas más tarde» es una dirección y un número, y un formulario no debe hacer que alguien calcule cuál de los dos es negativo. Lo que dejes sin marcar no se envía: el silencio no es acuerdo, y contarlo como acuerdo sería la única forma de empeorar esto respecto a no preguntar. Sin cuenta, y se guarda poco: el país, una posición redondeada a unos once kilómetros y tus respuestas. El código postal se consulta una vez y luego se descarta. Tu respuesta tampoco mueve nada por sí sola. Las valoraciones a menos de 150 km entre sí se agrupan, un grupo necesita cinco apicultores antes de mostrarse a nadie, y la corrección es la mediana y no la media, para que una opinión rotunda no arrastre una región. Después espera a una persona que conozca esa región. Ambas aplicaciones enlazan desde la pantalla del año, en la lista y en la imagen, porque el momento de decir «aquí no» es mientras lees las fechas.',
      },
      pl: {
        title: 'Kalendarz pyta Ciebie',
        body: '38 wpisów roku pasiecznego napisano raz, dla środkowych Niemiec, a wszędzie indziej przesunięto je wzorem: tyle dni później na stopień szerokości geograficznej, tyle na 100 metrów wysokości. To rozsądny wzór i nadal tylko oszacowanie. Nikt nigdy nie sprawdził go z tym, co pszczelarze naprawdę robią w Andaluzji, w Bretanii czy na Mazurach. Od dziś mogą nam to powiedzieć. Ankieta najpierw pyta o kraj i kod pocztowy, żeby oceniane daty były tymi, które naprawdę byś widział, a potem przechodzi przez rok: pasuje, u mnie później, u mnie wcześniej, tu się tego nie robi. Nikogo nie pytamy o znak — „dwa tygodnie później" to kierunek i liczba, a formularz nie powinien kazać człowiekowi liczyć, która z nich jest ujemna. To, co pominiesz, nie zostanie wysłane: milczenie nie jest zgodą, a liczenie go jako zgody byłoby jedynym sposobem, by wyszło gorzej niż gdyby wcale nie pytać. Bez konta, a zapisywane jest niewiele: kraj, pozycja zaokrąglona do około jedenastu kilometrów i Twoje odpowiedzi. Kod pocztowy jest sprawdzany raz, a potem odrzucany. Twoja odpowiedź też sama nic nie przesuwa. Oceny w promieniu 150 km od siebie są grupowane, grupa potrzebuje pięciu pszczelarzy, zanim zostanie komukolwiek pokazana, a poprawka to mediana, nie średnia, żeby jedna mocna opinia nie poniosła całego regionu. Potem czeka na człowieka, który zna ten region. Obie aplikacje linkują do niej z ekranu roku, na liście i na obrazie, bo moment, w którym mówi się „tu nie", to ten, w którym czyta się daty.',
      },
    },
  },
  {
    date: '2026-11-05',
    tag: 'feature',
    text: {
      en: {
        title: 'The Picture of the Year, Now on the Phone',
        body: 'The ribbon that arrived on the website this morning is now in both apps, under the same two names: List and Overview. The apps do one thing differently, and on purpose. The website draws the picture only from tablet width up and gives a phone a plain list instead, because twelve months across 360 pixels is thirty pixels a month and unreadable. That is a limit of a web page, not of a phone: a sideways-scrolling strip inside a page fights the page’s own scrolling, whereas swiping a strip sideways in an app is an ordinary gesture. So the apps draw the year wider than the screen and let you drag it through — 90 points a month — and the row names stand in a column that does not move, so you still know which row you are reading in August. On a tablet or in landscape it simply fits. The photographs came along too, in the list as well as the picture, and they are carried inside the app rather than fetched: at the apiary there is usually no signal, and that is exactly where you want to see what a lime flower looks like.',
      },
      de: {
        title: 'Das Bild des Jahres, jetzt auf dem Handy',
        body: 'Das Band, das heute Morgen auf die Webseite kam, ist nun in beiden Apps, unter denselben zwei Namen: Liste und Übersicht. Eine Sache machen die Apps anders, und zwar mit Absicht. Die Webseite zeichnet das Bild erst ab Tablet-Breite und gibt dem Handy eine schlichte Liste, denn zwölf Monate auf 360 Pixel sind dreißig Pixel je Monat und nicht lesbar. Das ist eine Grenze der Webseite, nicht des Handys: ein seitlich scrollender Streifen in einer Seite kämpft gegen das Scrollen der Seite, während seitliches Wischen in einer App eine ganz normale Geste ist. Also zeichnen die Apps das Jahr breiter als den Bildschirm und man zieht es durch — 90 Punkte je Monat — und die Zeilennamen stehen in einer Spalte, die sich nicht bewegt, damit man im August noch weiß, welche Zeile man liest. Auf dem Tablet oder im Querformat passt es einfach hinein. Die Fotos sind mitgekommen, in der Liste wie im Bild, und sie liegen in der App statt geladen zu werden: am Bienenstand ist meist kein Netz, und genau dort will man sehen, wie eine Lindenblüte aussieht.',
      },
      fr: {
        title: 'L’image de l’année, maintenant sur le téléphone',
        body: 'Le ruban arrivé ce matin sur le site est désormais dans les deux applications, sous les mêmes deux noms : Liste et Vue d’ensemble. Les applications font une chose différemment, et à dessein. Le site ne dessine l’image qu’à partir de la largeur d’une tablette et donne au téléphone une simple liste, car douze mois sur 360 pixels font trente pixels par mois, illisible. C’est une limite de la page web, pas du téléphone : une bande qui défile latéralement dans une page lutte contre le défilement de la page, alors que glisser une bande de côté dans une application est un geste ordinaire. Les applications dessinent donc l’année plus large que l’écran et on la fait glisser — 90 points par mois — et les noms de lignes restent dans une colonne immobile, pour savoir encore en août quelle ligne on lit. Sur une tablette ou en paysage, elle tient tout simplement. Les photos ont suivi, dans la liste comme dans l’image, et elles sont embarquées plutôt que téléchargées : au rucher il n’y a généralement pas de réseau, et c’est précisément là qu’on veut voir à quoi ressemble une fleur de tilleul.',
      },
      es: {
        title: 'La imagen del año, ahora en el móvil',
        body: 'La banda que llegó esta mañana al sitio está ahora en ambas aplicaciones, con los mismos dos nombres: Lista y Vista general. Las aplicaciones hacen una cosa distinta, y a propósito. El sitio dibuja la imagen solo desde el ancho de una tableta y da al móvil una lista sencilla, porque doce meses en 360 píxeles son treinta píxeles por mes e ilegible. Es un límite de la página web, no del móvil: una franja que se desplaza de lado dentro de una página pelea con el desplazamiento de la propia página, mientras que deslizar una franja de lado en una aplicación es un gesto corriente. Así que las aplicaciones dibujan el año más ancho que la pantalla y se arrastra — 90 puntos por mes — y los nombres de las filas están en una columna que no se mueve, para que en agosto sigas sabiendo qué fila lees. En una tableta o en horizontal simplemente cabe. Las fotos vinieron también, en la lista y en la imagen, y van dentro de la aplicación en vez de descargarse: en el colmenar casi nunca hay cobertura, y es justo allí donde quieres ver cómo es una flor de tilo.',
      },
      pl: {
        title: 'Obraz roku, teraz na telefonie',
        body: 'Wstęga, która dziś rano pojawiła się na stronie, jest teraz w obu aplikacjach, pod tymi samymi dwiema nazwami: Lista i Przegląd. Jedną rzecz aplikacje robią inaczej, i to celowo. Strona rysuje obraz dopiero od szerokości tabletu, a telefonowi daje zwykłą listę, bo dwanaście miesięcy na 360 pikselach to trzydzieści pikseli na miesiąc — nieczytelnie. To ograniczenie strony internetowej, nie telefonu: pasek przesuwany na boki wewnątrz strony walczy z przewijaniem samej strony, a przesunięcie paska w aplikacji to zwyczajny gest. Aplikacje rysują więc rok szerzej niż ekran i przeciąga się go przez ekran — 90 punktów na miesiąc — a nazwy wierszy stoją w kolumnie, która się nie rusza, żeby w sierpniu wciąż było wiadomo, który wiersz się czyta. Na tablecie albo w poziomie po prostu się mieści. Zdjęcia też przyszły, na listę i na obraz, i są w aplikacji, a nie pobierane: w pasiece zwykle nie ma sieci, a właśnie tam chce się zobaczyć, jak wygląda kwiat lipy.',
      },
    },
  },
  {
    date: '2026-11-05',
    tag: 'feature',
    text: {
      en: {
        title: 'The Beekeeping Year, as One Picture',
        body: 'The beekeeping year has been a list: what to do now, month by month. On the website it is now also a ribbon — the whole year across the screen, a row per subject, a bar per job. Every job carries a photograph of the thing itself: the plant in flower, a capped queen cell, the mite on a bee, the wax going into the melter. A plant is one bar, from driving out to it to the last frame spun, and hovering it tells you both halves. On a phone the year runs down the screen instead, because twelve months across 360 pixels is thirty pixels a month. The pictures come from Wikimedia Commons and name their photographer and licence beside them.',
      },
      de: {
        title: 'Das Imkerjahr als ein Bild',
        body: 'Das Imkerjahr war eine Liste: was jetzt zu tun ist, Monat für Monat. Auf der Webseite ist es nun auch ein Band — das ganze Jahr über den Bildschirm, eine Zeile je Thema, ein Balken je Aufgabe. Jede Aufgabe trägt ein Foto der Sache selbst: die Pflanze in Blüte, eine verdeckelte Weiselzelle, die Milbe auf der Biene, das Wachs im Schmelzer. Eine Pflanze ist ein Balken, vom Hinfahren bis zur letzten geschleuderten Wabe, und beim Überfahren stehen beide Hälften da. Auf dem Handy läuft das Jahr stattdessen senkrecht, denn zwölf Monate auf 360 Pixel sind dreißig Pixel je Monat. Die Fotos stammen aus Wikimedia Commons und nennen Urheber und Lizenz daneben.',
      },
      fr: {
        title: 'L’année apicole en une image',
        body: 'L’année apicole était une liste : quoi faire maintenant, mois par mois. Sur le site, c’est désormais aussi un ruban — toute l’année en travers de l’écran, une ligne par sujet, une barre par travail. Chaque travail porte une photo de la chose même : la plante en fleur, une cellule royale operculée, le varroa sur une abeille, la cire au fondoir. Une plante est une seule barre, du départ en transhumance au dernier cadre extrait, et le survol en donne les deux moitiés. Sur téléphone, l’année défile verticalement : douze mois sur 360 pixels font trente pixels par mois. Les photos viennent de Wikimedia Commons et citent leur auteur et leur licence.',
      },
      es: {
        title: 'El año apícola en una imagen',
        body: 'El año apícola era una lista: qué hacer ahora, mes a mes. En el sitio es ahora también una banda: todo el año a lo ancho de la pantalla, una fila por tema, una barra por tarea. Cada tarea lleva una foto de la cosa misma: la planta en flor, una celda real operculada, el ácaro sobre una abeja, la cera en el fundidor. Una planta es una sola barra, desde el traslado hasta el último cuadro extraído, y al pasar por encima aparecen las dos mitades. En el móvil el año va en vertical: doce meses en 360 píxeles son treinta píxeles por mes. Las fotos vienen de Wikimedia Commons y citan autor y licencia.',
      },
      pl: {
        title: 'Rok pasieczny jako jeden obraz',
        body: 'Rok pasieczny był listą: co robić teraz, miesiąc po miesiącu. Na stronie jest teraz także wstęgą — cały rok w poprzek ekranu, wiersz na temat, belka na zadanie. Każde zadanie ma zdjęcie samej rzeczy: roślinę w kwiecie, zasklepiony matecznik, roztocza na pszczole, wosk w topiarce. Roślina to jedna belka, od wyjazdu po ostatnią odwirowaną ramkę, a po najechaniu widać obie połowy. Na telefonie rok biegnie pionowo: dwanaście miesięcy na 360 pikselach to trzydzieści pikseli na miesiąc. Zdjęcia pochodzą z Wikimedia Commons i podają autora oraz licencję.',
      },
    },
  },
  {
    date: '2026-10-07',
    tag: 'design',
    text: {
      en: {
        title: 'A Softer Regional Health Map',
        body: 'The regional health map in the Members tab no longer shows hard-edged rectangles. Each area is now a soft, round patch of colour that fades out towards its edge and blends into its neighbours, like a real heat map. It looks the same on the website, Android and iPhone, and you tap or hover over the middle of a patch to see the figures behind it.',
      },
      de: {
        title: 'Eine weichere regionale Gesundheitskarte',
        body: 'Die regionale Gesundheitskarte im Mitglieder-Tab zeigt keine harten Rechtecke mehr. Jedes Gebiet ist jetzt ein weicher, runder Farbfleck, der zum Rand hin ausläuft und in die Nachbarn übergeht, wie bei einer echten Heatmap. Auf der Webseite, Android und iPhone sieht sie gleich aus, und auf die Mitte eines Flecks tippen oder mit der Maus darüberfahren zeigt die Zahlen dahinter.',
      },
      fr: {
        title: 'Une carte régionale de santé plus douce',
        body: 'La carte régionale de santé de l’onglet Membres n’affiche plus de rectangles aux bords durs. Chaque zone est maintenant une tache de couleur ronde et douce, qui s’estompe vers le bord et se fond dans ses voisines, comme une vraie carte de chaleur. Elle est identique sur le site, Android et iPhone, et il suffit de toucher ou de survoler le centre d’une tache pour voir les chiffres derrière.',
      },
      es: {
        title: 'Un mapa regional de salud más suave',
        body: 'El mapa regional de salud de la pestaña Miembros ya no muestra rectángulos de bordes duros. Cada zona es ahora una mancha de color redonda y suave que se difumina hacia el borde y se mezcla con las vecinas, como un mapa de calor de verdad. Se ve igual en la web, Android y iPhone, y basta tocar o pasar el cursor sobre el centro de una mancha para ver las cifras que hay detrás.',
      },
      pl: {
        title: 'Łagodniejsza regionalna mapa zdrowia',
        body: 'Regionalna mapa zdrowia na karcie Członkowie nie pokazuje już ostrych prostokątów. Każdy obszar jest teraz miękką, okrągłą plamą koloru, która zanika ku brzegowi i łączy się z sąsiednimi, jak prawdziwa mapa cieplna. Wygląda tak samo w serwisie, na Androidzie i iPhonie, a dotknięcie środka plamy lub najechanie na nią kursorem pokazuje stojące za nią liczby.',
      },
    },
  },
  {
    date: '2026-10-07',
    tag: 'feature',
    text: {
      en: {
        title: 'HivePulse Now Speaks Polish',
        body: 'The website, the iPhone and Android apps, the e-mails and the beekeeping year are now also available in Polish, with the usual beekeepers’ words: pasieka, rodzina pszczela, przegląd. Pick Polski in the language menu or in your profile. A native speaker has not read everything yet, so if a word sounds odd to you, tell us.',
      },
      de: {
        title: 'HivePulse spricht jetzt Polnisch',
        body: 'Die Website, die Apps für iPhone und Android, die E-Mails und das Imkerjahr gibt es jetzt auch auf Polnisch, mit den üblichen Imkerbegriffen: pasieka, rodzina pszczela, przegląd. Wähle Polski im Sprachmenü oder in deinem Profil. Eine Muttersprachlerin oder ein Muttersprachler hat noch nicht alles gelesen; wenn dir ein Wort seltsam vorkommt, sag es uns.',
      },
      fr: {
        title: 'HivePulse parle maintenant polonais',
        body: 'Le site, les applications iPhone et Android, les e-mails et l’année apicole existent désormais aussi en polonais, avec les termes habituels des apiculteurs : pasieka, rodzina pszczela, przegląd. Choisissez Polski dans le menu des langues ou dans votre profil. Un locuteur natif n’a pas encore tout relu ; si un mot vous semble étrange, dites-le-nous.',
      },
      es: {
        title: 'HivePulse ya habla polaco',
        body: 'El sitio web, las apps para iPhone y Android, los correos y el año apícola están ahora también en polaco, con los términos habituales de los apicultores: pasieka, rodzina pszczela, przegląd. Elige Polski en el menú de idiomas o en tu perfil. Un hablante nativo aún no ha leído todo; si una palabra te suena rara, cuéntanoslo.',
      },
      pl: {
        title: 'HivePulse mówi teraz po polsku',
        body: 'Serwis, aplikacje na iPhone\'a i Androida, e-maile i rok pszczelarski są teraz dostępne także po polsku, ze zwykłymi słowami pszczelarzy: pasieka, rodzina pszczela, przegląd. Wybierz Polski w menu języków lub w profilu. Native speaker nie przeczytał jeszcze wszystkiego, więc jeśli jakieś słowo brzmi dziwnie, daj nam znać.',
      },
    },
  },
  {
    date: '2026-10-07',
    tag: 'feature',
    text: {
      en: {
        title: 'Invitations Without Pasting a Link',
        body: 'If you sign in with Apple or Google, an invitation sent to that address is already waiting in your apiary list. Tap Accept, done. The envelope icon is gone from the apps’ toolbar; a link from an e-mail is still redeemed at the end of the apiary list.',
      },
      de: {
        title: 'Einladungen ohne Link einfügen',
        body: 'Wenn du dich mit Apple oder Google anmeldest, wartet eine an diese Adresse geschickte Einladung schon in deiner Liste der Bienenstände. Auf Annehmen tippen, fertig. Das Umschlag-Symbol in der Symbolleiste der Apps ist weg; ein Link aus einer E-Mail wird weiter am Ende der Liste der Bienenstände eingelöst.',
      },
      fr: {
        title: 'Des invitations sans lien à coller',
        body: 'Si vous vous connectez avec Apple ou Google, une invitation envoyée à cette adresse vous attend déjà dans la liste des ruchers. Touchez Accepter, c’est fait. L’icône d’enveloppe a quitté la barre des applications ; un lien reçu par e-mail s’utilise toujours à la fin de la liste des ruchers.',
      },
      es: {
        title: 'Invitaciones sin pegar un enlace',
        body: 'Si inicias sesión con Apple o Google, una invitación enviada a esa dirección ya te espera en la lista de colmenares. Toca Aceptar y listo. El icono de sobre ya no está en la barra de las apps; un enlace de un correo se sigue usando al final de la lista de colmenares.',
      },
      pl: {
        title: 'Zaproszenia bez wklejania linku',
        body: 'Jeśli logujesz się przez Apple lub Google, zaproszenie wysłane na ten adres czeka już na liście twoich pasiek. Dotknij Przyjmij i gotowe. Ikona koperty zniknęła z paska narzędzi aplikacji; link z e-maila nadal realizuje się na końcu listy pasiek.',
      },
    },
  },
  {
    date: '2026-10-07',
    tag: 'fix',
    text: {
      en: {
        title: 'Add a Hive Without a Sticker, in Both Apps',
        body: 'On the apiary page of the iPhone and Android apps there was no way to add a hive unless you scanned a printed QR code. Now the amber New Hive button is there, as it is on the website: name, type, date and notes, and the hive exists. The sticker still opens and sets up a hive as before.',
      },
      de: {
        title: 'Ein Volk ohne Aufkleber anlegen, in beiden Apps',
        body: 'Auf der Seite des Bienenstands gab es in den Apps für iPhone und Android keinen Weg, ein Volk anzulegen, außer einen gedruckten QR-Code zu scannen. Jetzt gibt es den bernsteinfarbenen Knopf „Neues Volk“, wie auf der Webseite: Name, Beutentyp, Datum und Notizen, und das Volk ist da. Der Aufkleber öffnet und richtet ein Volk weiter wie bisher ein.',
      },
      fr: {
        title: 'Ajouter une ruche sans autocollant, dans les deux applications',
        body: 'Sur la page du rucher des applications iPhone et Android, on ne pouvait ajouter une ruche qu’en scannant un QR code imprimé. Le bouton ambre « Nouvelle ruche » est maintenant là, comme sur le site : nom, type, date et notes, et la ruche existe. L’autocollant ouvre et configure toujours une ruche comme avant.',
      },
      es: {
        title: 'Añadir una colmena sin pegatina, en ambas apps',
        body: 'En la página del colmenar de las apps de iPhone y Android no había forma de añadir una colmena salvo escaneando un código QR impreso. Ahora está el botón ámbar «Nueva colmena», como en la web: nombre, tipo, fecha y notas, y la colmena existe. La pegatina sigue abriendo y configurando una colmena como antes.',
      },
      pl: {
        title: 'Dodaj rodzinę bez naklejki, w obu aplikacjach',
        body: 'Na stronie pasieki w aplikacjach na iPhone\'a i Androida nie dało się dodać rodziny bez zeskanowania wydrukowanego kodu QR. Teraz jest tam bursztynowy przycisk Nowa rodzina, tak jak w serwisie: nazwa, typ, data i notatki, i rodzina istnieje. Naklejka nadal otwiera i zakłada rodzinę jak dotąd.',
      },
    },
  },
  {
    date: '2026-10-07',
    tag: 'feature',
    text: {
      en: {
        title: 'The Beekeeping Year: What to Do When, for Your Place',
        body: 'A new timeline shows what a beekeeper does month by month: feeding with candy in February, the first inspections, swarm control at least every 9 days, drone frames against varroa, when to move for rapeseed, acacia, linden, fir or heather and when to extract each honey, and the preparation for winter. It scrolls endlessly, opens at today and speaks your language. Give your country and postal code and every date moves to your place; you can adjust it by hand. The dates are guide values, not rules, and medicines are only ever as approved in your country. On the website and in both apps.',
      },
      de: {
        title: 'Das Imkerjahr: was wann zu tun ist, für deinen Ort',
        body: 'Ein neuer Zeitstrahl zeigt, was ein Imker Monat für Monat tut: im Februar mit Futterteig füttern, die ersten Kontrollen, Schwarmkontrolle spätestens alle 9 Tage, Drohnenrahmen gegen Varroa, wann für Raps, Akazie, Linde, Tanne oder Heide zu verlagern und wann jeder Honig zu schleudern ist, und die Vorbereitung auf den Winter. Er scrollt endlos, öffnet sich bei heute und spricht deine Sprache. Gib Land und Postleitzahl an, und jedes Datum verschiebt sich auf deinen Ort; von Hand lässt es sich anpassen. Die Termine sind Richtwerte, keine Vorschriften, und Arzneimittel gibt es nur wie in deinem Land zugelassen. Auf der Webseite und in beiden Apps.',
      },
      fr: {
        title: 'L’année apicole : quoi faire et quand, pour votre lieu',
        body: 'Une nouvelle frise montre ce qu’un apiculteur fait mois par mois : nourrir au candi en février, les premières visites, le contrôle de l’essaimage au moins tous les 9 jours, les cadres à mâles contre le varroa, quand déplacer pour le colza, l’acacia, le tilleul, le sapin ou la bruyère et quand extraire chaque miel, et la préparation de l’hiver. Elle défile sans fin, s’ouvre à aujourd’hui et parle votre langue. Indiquez votre pays et votre code postal et chaque date se décale pour votre lieu ; vous pouvez l’ajuster à la main. Les dates sont des valeurs indicatives, pas des règles, et les médicaments ne le sont que selon l’autorisation de votre pays. Sur le site et dans les deux applications.',
      },
      es: {
        title: 'El año apícola: qué hacer y cuándo, para tu lugar',
        body: 'Una nueva línea del tiempo muestra lo que hace un apicultor mes a mes: alimentar con candy en febrero, las primeras revisiones, el control de la enjambrazón como mínimo cada 9 días, los cuadros de zánganos contra la varroa, cuándo trasladar para colza, acacia, tilo, abeto o brezo y cuándo extraer cada miel, y la preparación del invierno. Se desplaza sin fin, se abre en hoy y habla tu idioma. Indica tu país y tu código postal y cada fecha se adapta a tu lugar; puedes ajustarla a mano. Las fechas son valores orientativos, no normas, y los medicamentos solo según la autorización de tu país. En la web y en ambas apps.',
      },
      pl: {
        title: 'Rok pszczelarski: co robić i kiedy, dla twojego miejsca',
        body: 'Nowa oś czasu pokazuje, co pszczelarz robi miesiąc po miesiącu: karmienie ciastem cukrowym w lutym, pierwsze przeglądy, kontrola rójki najpóźniej co 9 dni, ramki trutowe przeciw Varroa, kiedy przewozić na rzepak, akację, lipę, jodłę lub wrzos i kiedy odwirować każdy miód, oraz przygotowanie do zimy. Przewija się bez końca, otwiera się na dzisiejszym dniu i mówi w twoim języku. Podaj kraj i kod pocztowy, a każda data przesunie się na twoje miejsce; możesz ją też poprawić ręcznie. Terminy to wartości orientacyjne, nie przepisy, a leki zawsze tylko takie, jakie są dopuszczone w twoim kraju. W serwisie i w obu aplikacjach.',
      },
    },
  },
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
      pl: {
        title: 'Twój dzień w skrócie i zabiegi, które możesz zaplanować',
        body: 'Początek listy pasiek mówi teraz, co jest ważne: kiedy przypada następny przegląd (liczony od twojego odstępu przypomnień), jak radzą sobie twoje rodziny (w porządku, do obserwacji lub alarm, z powodem) i jakie zabiegi się zbliżają. Możesz zaplanować zabieg dla pojedynczej rodziny lub dla wszystkich rodzin pasieki, z preparatem i dniem, i odhaczyć go po wykonaniu. Od czasu do czasu to samo miejsce może zawierać ogłoszenie od nas; nie ma sieci reklamowej i nic nie jest śledzone. Serwis już to ma; aplikacje dostaną to w kolejnych wersjach.',
      },
    },
  },
  {
    date: '2026-10-07',
    tag: 'feature',
    text: {
      en: {
        title: 'Taking Hives to the Bloom, and Seeing Where They Went',
        body: 'Migratory beekeepers can now move hives as one action: pick the hives, the new place (an existing apiary or a new one, with an address), the day and the forage, from acacia and rapeseed to fir and heather. Every move is kept. Each hive shows where it has stood, and a map of moves draws the journey of every hive, numbered stop by stop. Only the owner of an apiary can move its hives. When hives shuttle between two places, a shortcut sends them back to where they stood before with one tap. The website has it now; the apps follow with their next versions.',
      },
      de: {
        title: 'Völker zur Blüte bringen und sehen, wo sie waren',
        body: 'Wanderimker können Völker jetzt in einem Schritt verlagern: Völker wählen, den neuen Ort (ein vorhandener Bienenstand oder ein neuer, mit Adresse), den Tag und die Tracht, von Akazie und Raps bis Tanne und Heide. Jede Verlagerung bleibt gespeichert. Jedes Volk zeigt, wo es gestanden hat, und die Wanderkarte zeichnet den Weg jedes Volks, Station für Station nummeriert. Verlagern darf nur der Besitzer eines Bienenstands. Pendeln Völker zwischen zwei Orten, schickt eine Schnellwahl sie mit einem Tipp zurück dorthin, wo sie vorher standen. Auf der Webseite gibt es das jetzt, die Apps folgen mit ihren nächsten Versionen.',
      },
      fr: {
        title: 'Emmener les ruches à la floraison, et voir où elles sont passées',
        body: "Les apiculteurs transhumants peuvent désormais déplacer des ruches en une seule action : choisir les ruches, le nouveau lieu (un rucher existant ou un nouveau, avec une adresse), le jour et la miellée, de l'acacia et du colza au sapin et à la bruyère. Chaque déplacement est conservé. Chaque ruche montre où elle a été, et la carte des déplacements trace le parcours de chaque ruche, étape par étape. Seul le propriétaire d'un rucher peut en déplacer les ruches. Quand des ruches font la navette entre deux lieux, un raccourci les renvoie d'un geste là où elles étaient avant. Le site l'offre dès maintenant ; les applications suivent avec leurs prochaines versions.",
      },
      es: {
        title: 'Llevar las colmenas a la floración y ver dónde han estado',
        body: 'Los apicultores trashumantes ya pueden trasladar colmenas en un solo paso: elegir las colmenas, el nuevo lugar (un colmenar existente o uno nuevo, con dirección), el día y la floración, desde la acacia y la colza hasta el abeto y el brezo. Cada traslado queda guardado. Cada colmena muestra dónde ha estado, y el mapa de traslados dibuja el recorrido de cada una, parada por parada. Solo el propietario de un colmenar puede trasladar sus colmenas. Cuando las colmenas van y vienen entre dos lugares, un atajo las devuelve con un toque a donde estaban antes. La web ya lo tiene; las aplicaciones lo recibirán con sus próximas versiones.',
      },
      pl: {
        title: 'Zabieranie rodzin na pożytek i oglądanie, dokąd pojechały',
        body: 'Pszczelarze wędrowni mogą teraz przewozić rodziny jednym działaniem: wybierz rodziny, nowe miejsce (istniejącą pasiekę lub nową, z adresem), dzień i pożytek, od akacji i rzepaku po jodłę i wrzos. Każde przeniesienie jest zapamiętywane. Każda rodzina pokazuje, gdzie stała, a mapa przeniesień rysuje podróż każdej rodziny, przystanek po przystanku. Rodziny pasieki może przenosić tylko jej właściciel. Gdy rodziny kursują między dwoma miejscami, skrót odsyła je jednym dotknięciem tam, gdzie stały wcześniej. Serwis już to ma; aplikacje dostaną to w kolejnych wersjach.',
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
      pl: {
        title: 'Dwóch pszczelarzy, jedna pasieka',
        body: 'Możesz teraz zaprosić innego pszczelarza do wspólnej pracy nad pasieką lub nad pojedynczymi rodzinami. Wpisz jego adres e-mail, osoba przyjmie zaproszenie i zobaczy to, co udostępniasz: może zapisywać przeglądy, edytować rodziny i oglądać liczby, a wszystko, co wpisze, nosi jej imię. Tylko ty możesz usuwać, zapraszać innych lub umieścić pasiekę na mapie publicznej. Jeśli kiedyś usuniesz konto, współdzielona pasieka trafia do osoby, która przyjęła zaproszenie jako pierwsza, aby to, co razem zbudowaliście, nie przepadło. Udostępnianie jest już w serwisie, a do aplikacji trafi w kolejnych wersjach.',
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
      pl: {
        title: 'Usuwaj partie kodów QR, których nie potrzebujesz',
        body: 'Partię kodów QR wygenerowaną przez pomyłkę lub nigdy niewydrukowaną można teraz usunąć w serwisie, a w aplikacjach na iPhone\'a i Androida w ich kolejnych wersjach. Partia zostaje, dopóki jeden z jej kodów jest przyklejony do rodziny, bo skanowanie tej naklejki to sposób, w jaki rodzina jest odnajdywana.',
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
      pl: {
        title: 'Logowanie przez Apple lub Google, bez hasła do zapamiętania',
        body: 'Możesz teraz logować się kontem Apple lub Google, w serwisie i w wersjach testowych aplikacji: Apple na iPhonie i w serwisie, Google na Androidzie, iPhonie i w serwisie. Jeśli adres e-mail jest ten sam, trafiasz na istniejące konto, ze wszystkimi rodzinami. Formularz e-mail nadal istnieje, jako dyskretny link pod przyciskami. HivePulse otrzymuje od nich tylko twoje imię i adres, nigdy hasło.',
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
      pl: {
        title: 'Usterka znaleziona, zanim ktokolwiek na nią trafił',
        body: 'Serwer utrzymuje zestaw otwartych połączeń z bazą danych, aby szybko odpowiadać. W cichych okresach połączenia te były zamykane z drugiej strony, a serwer tego nie zauważał, więc pierwsze żądanie po przerwie mogło skończyć się błędem: pasieka, która po prostu się nie wczytywała. Nasz własny monitoring wychwycił to w systemie testowym, zanim zetknął się z tym jakikolwiek pszczelarz. Serwer sprawdza teraz połączenie przed użyciem i w razie potrzeby po cichu otwiera nowe. Po twojej stronie nie trzeba nic robić.',
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
      pl: {
        title: 'Potrzeba dwunastu pszczelarzy, zanim aplikacja będzie mogła się ukazać',
        body: 'HivePulse jest gotowy, ale jeszcze nie ma go w sklepach, i nie z braku starań. Zanim Google pozwoli nowemu deweloperowi opublikować aplikację, dwanaście osób musi ją testować przez czternaście kolejnych dni. Runda testowa jest więc bramą, nie formalnością. Jeśli masz pszczoły i telefon z Androidem lub iPhone\'a, możesz pobrać aplikację już teraz i pomóc jej dotrzeć do wszystkich innych: jest strona wyjaśniająca, na czym to polega, co zgłaszać i co dzieje się z twoimi danymi. Kwadrans na konfigurację i jedna wizyta przy ulach, by się przydać.',
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
      pl: {
        title: 'Serwis nie zdradza już Google\'owi twojej wizyty',
        body: 'Czcionki używane w całym serwisie były ładowane z serwerów Google, co oznaczało, że każde wyświetlenie strony przekazywało Google twój adres IP, zanim pojawiło się jakiekolwiek słowo. Teraz są dostarczane z naszych własnych serwerów, więc nikt z zewnątrz nie dowiaduje się o twojej wizycie. Jedna z czterech czcionek okazała się ładowana w pięciu grubościach i nieużywana nigdzie, więc też zniknęła: trochę mniej do pobrania przy pierwszej wizycie.',
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
      pl: {
        title: 'Awarie nie przechodzą już niezauważone',
        body: 'Gdy aplikacja zamykała się w środku przeglądu, nikt się o tym nie dowiadywał, chyba że pszczelarz napisał. Obie aplikacje i serwer wysyłają teraz raport, gdy coś się psuje: miejsce w kodzie, wersję aplikacji i rodzaj urządzenia. Celowo pomijają wszystko o tobie: żadnych notatek z przeglądów, haseł, adresów e-mail, adresów IP ani zrzutów ekranu. Raport zawiera numer twojego konta i nic więcej, a przechowywany jest w Europie. Raporty trafiają do Sentry, które przetwarza je w naszym imieniu.',
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
      pl: {
        title: 'Liczba ramek w rękawicach: dotknij liczby',
        body: 'Ramki z czerwiem i miodem wpisywało się przyciskami plus i minus; na iPhonie były to maleńkie systemowe strzałki, trudne do użycia w rękawicach, a wybranie ośmiu ramek oznaczało osiem dotknięć. Obie aplikacje pokazują teraz każdą wartość od 0 do 10 jako osobny duży przycisk na całą szerokość formularza. Jedno dotknięcie ustawia liczbę, ponowne ją czyści. Przyciski mają 60 punktów wysokości na iPhonie i 68 dp na Androidzie, wygodnie więcej, niż potrzebuje palec w rękawicy.',
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
      pl: {
        title: 'Aplikacja na Androida znów jest wszędzie bursztynowa',
        body: 'Przyciski i karty w aplikacji na Androida w kilku miejscach miały domyślny liliowy kolor Androida: przyciski plus i minus dla ramek z czerwiem i miodem oraz karta statystyk, bo aplikacja nigdy nie powiedziała systemowi, jakich kolorów użyć na tych powierzchniach. Teraz podążają za bursztynowo-kamienną paletą HivePulse jak wszystko inne. Lista pasiek i lista partii kodów QR zostawiają też miejsce na dole, więc ostatnia pozycja nie chowa się już za okrągłym przyciskiem.',
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
      pl: {
        title: 'Udostępnij pasiekę później i aktualności w twoim języku',
        body: 'Pasiekę można było umieścić na mapie publicznej tylko przy jej tworzeniu, a w aplikacji na iPhone\'a nawet wtedy nie, i edycja pasieki na iPhonie po cichu odrzucała twoje zmiany. Obie aplikacje pozwalają teraz edytować pasiekę w dowolnym momencie, łącznie z przełącznikiem „Pokaż na mapie publicznej”, a zmiany są zapisywane. Na mapie społeczności i w jej liczbach liczą się tylko pasieki publiczne. W serwisie wpisy z aktualności pojawiają się w twoim języku, zdjęcie szerszenia azjatyckiego w tropicielu szerszeni wróciło, a górna nawigacja nie ucina już przycisku pobierania przy dłuższych niemieckich lub francuskich etykietach.',
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
        body: 'Registrar una revisión en la colmena ahora es más rápido. La fuerza de la colonia se elige simplemente entre débil, media o fuerte, y la varroa se anota como ninguna, baja, media o alta en lugar de un recuento de ácaros, tanto en las apps de iOS y Android como en la web. Tus registros anteriores se convirtieron automáticamente. El color de la reina se elige tocando un punto de color. Y por fin puedes editar el nombre, el tipo, la fecha de adquisición y las notas de una colmena directamente en las apps, no solo en la web. Además, las colonias fuertes vuelven a guardarse correctamente en la app de Android.',
      },
      pl: {
        title: 'Słowa zamiast liczb podczas przeglądu',
        body: 'Zapisywanie przeglądu przy rodzinie jest teraz szybsze. Siła rodziny to prosty wybór: słaba, średnia lub silna, a Varroa zapisuje się jako brak, niska, średnia lub wysoka zamiast liczby roztoczy, zarówno w aplikacjach na iOS i Androida, jak i w serwisie. Twoje wcześniejsze wpisy zostały przekonwertowane automatycznie. Kolor matki wybiera się dotknięciem kolorowej kropki. Wreszcie możesz edytować nazwę, typ, datę nabycia i notatki rodziny bezpośrednio w aplikacjach, nie tylko w serwisie. Silne rodziny zapisują się teraz poprawnie także w aplikacji na Androida.',
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
      pl: {
        title: 'Jaśniejszy, spokojniejszy HivePulse',
        body: 'Serwis ma nowy wygląd. Ciężka ciemna zieleń ustąpiła białym i ciepłym szarym powierzchniom, a kolor sygnalizuje teraz, na co patrzysz: zieleń dla pasiek i rodzin, bursztyn dla komunikatów, czerwień dla zdrowia rodzin i tropiciela szerszeni, a niebieskoszary dla statystyk i pomocy. Pasek boczny panelu jest jasny, liczby są ustawione wyraźną czcionką o stałej szerokości, a przyciski są większe i łatwiejsze do trafienia. Logotyp HivePulse też jest bardziej zaokrąglony. Nic się nie przesunęło i każda funkcja działa dokładnie jak wcześniej, po prostu jest łagodniejsze dla oczu.',
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
        title: 'Números legibles y traducciones correctas en el formulario de revisión',
        body: 'Al registrar una revisión en el iPhone solo se veían un más y un menos para los cuadros de cría, los cuadros de miel y la fuerza de la colonia: faltaba el número, así que no se veía qué valor se estaba poniendo. El número ha vuelto. Las opciones de estado de ánimo, color de la reina y fuerza de la colonia también aparecían en inglés sin importar el idioma; ahora están traducidas al alemán, francés, español e inglés en ambas apps. El peso de la colmena ya no es un simple cuadro de texto: conserva el teclado para valores exactos y añade botones de más y menos en pasos de medio kilo, cómodos con guantes. En la web, la leyenda del gráfico de ánimo también mostraba etiquetas en inglés y ahora sigue tu idioma.',
      },
      pl: {
        title: 'Czytelne liczby i poprawne tłumaczenia w formularzu przeglądu',
        body: 'Zapisywanie przeglądu na iPhonie pokazywało tylko plus i minus przy ramkach z czerwiem, ramkach z miodem i sile rodziny; brakowało samej liczby, więc nie było widać, co się ustawia. Liczba wróciła. Opcje temperamentu rodziny, koloru matki i siły rodziny pojawiały się też po angielsku bez względu na używany język; teraz są przetłumaczone na niemiecki, francuski, hiszpański i angielski w obu aplikacjach. Waga rodziny nie jest już zwykłym polem tekstowym: zachowuje klawiaturę dla dokładnych wartości i dodaje przyciski plus i minus w krokach co pół kilograma, dla rąk w rękawicach przy ulu. W serwisie legenda wykresu temperamentu też pokazywała angielskie etykiety, a teraz podąża za twoim językiem.',
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
      pl: {
        title: 'Strona członków znów ładuje się natychmiast',
        body: 'Pole społeczności na stronie członków czekało na statystyki globalne, zanim cokolwiek pokazało, a te statystyki liczono osobnym zapytaniem do bazy dla każdej pasieki i rodziny, co trwało kilka sekund w miarę rozrostu społeczności. Serwer zbiera je teraz kilkoma zapytaniami, a monit o zalogowanie lub status wspierającego pojawia się od razu, gdy liczby się uzupełniają.',
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
        body: 'La primera vez que inicias sesión en la app de iOS o Android, un breve recorrido deslizable te presenta lo que HivePulse puede hacer por ti: códigos QR en cada colmena, revisiones rápidas, estadísticas, recordatorios y el rastreador de avispones. Puedes saltarlo cuando quieras y volver a verlo desde Ajustes con «Mostrar de nuevo el recorrido».',
      },
      pl: {
        title: 'Przewodnik dla nowych użytkowników w obu aplikacjach',
        body: 'Przy pierwszym logowaniu do aplikacji na iOS lub Androida krótki przewodnik do przewijania przedstawia teraz, co HivePulse może dla ciebie zrobić: kody QR na każdej rodzinie, szybkie przeglądy, statystyki, przypomnienia i tropiciel szerszeni. Pomiń go w dowolnej chwili i przywołaj później z Ustawień przyciskiem „Pokaż przewodnik ponownie”.',
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
      pl: {
        title: 'Aplikacja na iOS dostaje nowy wygląd HivePulse i nadrabia zaległości względem serwisu i Androida',
        body: 'Aplikacja na iPhone\'a używa teraz tego samego bursztynowo-kamiennego designu i kroju DM Sans co serwis. Dostała też wszystko, co ostatnio zyskała aplikacja na Androida: drukowalne PDF z kodami QR otwierane od razu, przypomnienia e-mail, ogólnokontowy przegląd statystyk, linki do resetu hasła, zarządzanie własnymi polami dla wszystkich pasiek lub tylko jednej oraz, dla wspierających, regionalną mapę zdrowia na karcie Członkowie.',
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
      pl: {
        title: 'Naprawione pobieranie PDF z kodami QR w aplikacji na Androida',
        body: 'Dotknięcie Pobierz PDF przy partii kodów QR w aplikacji na Androida nic nie robiło: pobieranie było przekazywane poza aplikację i po dłuższym czasie otwartej sesji cicho się nie udawało. Aplikacja pobiera teraz drukowalny PDF sama, zapisuje go w folderze Pobrane i od razu otwiera, a ponowne dotknięcie nie tworzy już zdublowanych kopii.',
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
        body: 'La app de Android tiene ahora la misma página de estadísticas de toda la cuenta que el panel web: colmenares, colmenas e revisiones de un vistazo, desglosados por colmenar para cualquier periodo. Los colaboradores también tienen el mapa regional de salud en la pestaña Miembros, con las mismas capas de varroa, ánimo, enjambrazón y cría que en la web.',
      },
      pl: {
        title: 'Przegląd statystyk i mapa zdrowia społeczności trafiają na Androida',
        body: 'Aplikacja na Androida ma teraz tę samą ogólnokontową stronę statystyk co panel internetowy: pasieki, rodziny i przeglądy w skrócie, z podziałem na pasieki dla dowolnego okresu. Wspierający dostają też regionalną mapę zdrowia na karcie Członkowie, z tymi samymi nakładkami Varroa, temperamentu, rójki i czerwiu co w sieci.',
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
      pl: {
        title: 'Własne pola, przypomnienia e-mail i reset hasła prosto w aplikacji na Androida',
        body: 'Kilka rzeczy dało się wcześniej zrobić tylko w serwisie. W aplikacji na Androida możesz teraz tworzyć, edytować i usuwać własne pola (dla wszystkich pasiek lub tylko jednej), włączyć przypomnienia e-mail obok powiadomień push i poprosić o link do resetu hasła bez opuszczania aplikacji.',
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
      pl: {
        title: 'Nawigacja panelu działa już na telefonie',
        body: 'Pasek boczny panelu chował całą nawigację na małych ekranach i nic jej nie zastępowało, więc odwiedzający z telefonu nie mieli jak dotrzeć do niczego poza przyciskiem wylogowania. Nowy przełącznik menu pokazuje teraz twoje pasieki, statystyki, profil i każdą inną stronę z poziomu telefonu.',
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
        title: 'Los recordatorios de revisión ya también llegan por correo',
        body: 'Las notificaciones push solo llegaban a las apps de iOS y Android, así que quien usaba solo la web nunca recibía aviso de una revisión atrasada. Ahora puedes activar los recordatorios por correo desde tu página de perfil, de forma independiente a las notificaciones push: uno, otro, ambos o ninguno.',
      },
      pl: {
        title: 'Przypomnienia o przeglądach także e-mailem',
        body: 'Powiadomienia push docierały tylko do aplikacji na iOS i Androida, więc pszczelarze korzystający wyłącznie z serwisu nie mieli jak dowiedzieć się o spóźnionym przeglądzie. Możesz teraz włączyć przypomnienia e-mail na stronie profilu, niezależnie od push, więc możesz włączyć jedno, oba albo żadne.',
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
      pl: {
        title: 'Naprawione pinezki na mapie publicznej dla pasiek z samym adresem',
        body: 'Pasieki publiczne tworzone w panelu internetowym zbierały tylko adres w wolnym tekście, nigdy współrzędnych GPS, więc były liczone w sumach społeczności, ale nigdy nie rysowano ich jako pinezki na mapie na żywo. Backend automatycznie zamienia teraz zapisany adres na współrzędne, więc każda pasieka publiczna z adresem będzie odtąd widoczna na mapie.',
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
      pl: {
        title: 'Nie pamiętasz hasła? Mamy to',
        body: 'Pełny proces zapomnianego hasła i jego resetu działa teraz w panelu internetowym, na iOS i na Androidzie: poproś o link do resetu e-mailem, ustaw nowe hasło, a wszystkie istniejące sesje zostaną dla bezpieczeństwa automatycznie wylogowane.',
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
        title: 'Campos de revisión personalizados: registra lo que te importa',
        body: 'Cada apicultor sigue cosas distintas. Las definiciones de campos personalizados te permiten añadir tus propios datos de revisión a nivel de colmenar o de colmena, con campos de texto, número, sí/no, fecha y selección, ya disponibles en el panel web, iOS y Android.',
      },
      pl: {
        title: 'Własne pola przeglądu: zapisuj to, co ważne dla ciebie',
        body: 'Każdy pszczelarz śledzi coś innego. Definicje własnych pól pozwalają dodać własne dane przeglądu na poziomie pasieki lub rodziny, z obsługą pól tekstowych, liczbowych, tak/nie, daty i wyboru, dostępne teraz w panelu internetowym, na iOS i na Androidzie.',
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
      pl: {
        title: 'Startuje panel internetowy: zarządzaj rodzinami z dowolnej przeglądarki',
        body: 'Nie potrzebujesz już aplikacji mobilnej, aby zajrzeć do swoich pszczół. Nowy panel w przeglądarce obejmuje logowanie, listę pasiek, szczegóły rodziny z wykresami Varroa, zarządzanie partiami kodów QR i osobiste statystyki, wszystko z komputera stacjonarnego lub laptopa.',
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
      pl: {
        title: 'Regionalne mapy cieplne Varroa na mapie publicznej',
        body: 'Publiczna mapa na żywo nakłada teraz mapę cieplną gęstości Varroa: nasilenie roztoczy zagregowane z pasiek publicznych w komórkach siatki o boku około 50 km, oznaczone kolorami od zielonego do czerwonego, aby pszczelarze od razu dostrzegali regionalne trendy ryzyka.',
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
      pl: {
        title: 'Lokalizacje pasiek pokazywane na poziomie miasta, nie dokładnego GPS',
        body: 'Aby chronić pszczelarzy przed potencjalną kradzieżą uli, mapa publiczna i strony społeczności pokazują teraz środek najbliższego miasta lub wsi zamiast dokładnych współrzędnych pasieki. Po zalogowaniu nadal widzisz własną dokładną lokalizację; rozmyty jest tylko widok publiczny.',
      },
    },
  },
];
