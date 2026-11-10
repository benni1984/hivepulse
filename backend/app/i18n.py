from typing import Optional

MESSAGES = {
    "INVALID_CREDENTIALS": {
        "en": "Invalid email or password.",
        "fr": "Email ou mot de passe invalide.",
        "de": "Ungültige E-Mail oder Passwort.",
        "es": "Correo electrónico o contraseña no válidos.",
        "pl": "Nieprawidłowy adres e-mail lub hasło.",
    },
    "INVALID_IDENTITY_TOKEN": {
        "en": "That sign-in could not be verified. Please try again.",
        "fr": "Cette connexion n'a pas pu être vérifiée. Veuillez réessayer.",
        "de": "Diese Anmeldung konnte nicht bestätigt werden. Bitte versuche es erneut.",
        "es": "No se ha podido verificar este inicio de sesión. Inténtalo de nuevo.",
        "pl": "Nie udało się zweryfikować tego logowania. Spróbuj ponownie.",
    },
    "EMAIL_NOT_VERIFIED": {
        "en": "Your provider has not confirmed this email address.",
        "fr": "Votre fournisseur n'a pas confirmé cette adresse e-mail.",
        "de": "Dein Anbieter hat diese E-Mail-Adresse nicht bestätigt.",
        "es": "Tu proveedor no ha confirmado esta dirección de correo.",
        "pl": "Twój dostawca nie potwierdził tego adresu e-mail.",
    },
    "SOCIAL_SIGN_IN_UNCONFIGURED": {
        "en": "Signing in this way is not available yet.",
        "fr": "Cette méthode de connexion n'est pas encore disponible.",
        "de": "Diese Anmeldeart steht noch nicht zur Verfügung.",
        "es": "Este modo de inicio de sesión aún no está disponible.",
        "pl": "Ten sposób logowania nie jest jeszcze dostępny.",
    },
    "NO_PASSWORD_SET": {
        "en": "This account signs in with Apple or Google and has no password. Use \"Forgot password\" to set one.",
        "fr": "Ce compte se connecte avec Apple ou Google et n'a pas de mot de passe. Utilisez \"Mot de passe oublié\" pour en définir un.",
        "de": "Dieses Konto meldet sich mit Apple oder Google an und hat kein Passwort. Über \"Passwort vergessen\" lässt sich eines festlegen.",
        "es": "Esta cuenta inicia sesión con Apple o Google y no tiene contraseña. Usa \"Olvidé mi contraseña\" para crear una.",
        "pl": "To konto loguje się przez Apple lub Google i nie ma hasła. Użyj opcji „Nie pamiętam hasła”, aby je ustawić.",
    },
    "TOKEN_EXPIRED": {
        "en": "Access token has expired.",
        "fr": "Le jeton d'accès a expiré.",
        "de": "Das Zugriffstoken ist abgelaufen.",
        "es": "El token de acceso ha caducado.",
        "pl": "Token dostępu wygasł.",
    },
    "TOKEN_INVALID": {
        "en": "Could not validate credentials.",
        "fr": "Impossible de valider les informations d'identification.",
        "de": "Anmeldeinformationen konnten nicht überprüft werden.",
        "es": "No se han podido validar las credenciales.",
        "pl": "Nie udało się zweryfikować danych logowania.",
    },
    "FORBIDDEN": {
        "en": "You do not have permission to access this resource.",
        "fr": "Vous n'avez pas la permission d'accéder à cette ressource.",
        "de": "Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.",
        "es": "No tienes permiso para acceder a este recurso.",
        "pl": "Nie masz uprawnień do tego zasobu.",
    },
    "POSTAL_CODE_NOT_FOUND": {
        "en": "That postal code could not be found in that country. A rating without a place cannot be used.",
        "fr": "Ce code postal est introuvable dans ce pays. Un avis sans lieu est inutilisable.",
        "de": "Diese Postleitzahl wurde in diesem Land nicht gefunden. Eine Bewertung ohne Ort ist nicht verwertbar.",
        "es": "No se ha encontrado ese código postal en ese país. Una valoración sin lugar no se puede usar.",
        "pl": "Nie znaleziono tego kodu pocztowego w tym kraju. Ocena bez miejsca jest nieprzydatna.",
    },
    "UNKNOWN_CALENDAR_ENTRY": {
        "en": "The timeline has no entry with that key.",
        "fr": "La chronologie ne contient aucune entrée avec cette clé.",
        "de": "Der Zeitstrahl hat keinen Eintrag mit diesem Schlüssel.",
        "es": "La cronología no tiene ninguna entrada con esa clave.",
        "pl": "Na osi czasu nie ma wpisu o tym kluczu.",
    },
    "YEAR_PROPOSAL_NOT_FOUND": {
        "en": "That proposal does not exist.",
        "fr": "Cette proposition n'existe pas.",
        "de": "Dieser Vorschlag existiert nicht.",
        "es": "Esa propuesta no existe.",
        "pl": "Ta propozycja nie istnieje.",
    },
    "USER_NOT_FOUND": {
        "en": "User not found.",
        "fr": "Utilisateur introuvable.",
        "de": "Benutzer nicht gefunden.",
        "es": "Usuario no encontrado.",
        "pl": "Nie znaleziono użytkownika.",
    },
    "APIARY_NOT_FOUND": {
        "en": "Apiary not found.",
        "fr": "Rucher introuvable.",
        "de": "Bienenstand nicht gefunden.",
        "es": "Colmenar no encontrado.",
        "pl": "Nie znaleziono pasieki.",
    },
    "HIVE_NOT_FOUND": {
        "en": "Hive not found.",
        "fr": "Ruche introuvable.",
        "de": "Volk nicht gefunden.",
        "es": "Colmena no encontrada.",
        "pl": "Nie znaleziono rodziny pszczelej.",
    },
    "INSPECTION_NOT_FOUND": {
        "en": "Inspection not found.",
        "fr": "Inspection introuvable.",
        "de": "Kontrolle nicht gefunden.",
        "es": "Inspección no encontrada.",
        "pl": "Nie znaleziono przeglądu.",
    },
    "FIELD_DEFINITION_NOT_FOUND": {
        "en": "Field definition not found.",
        "fr": "Définition de champ introuvable.",
        "de": "Felddefinition nicht gefunden.",
        "es": "Definición de campo no encontrada.",
        "pl": "Nie znaleziono definicji pola.",
    },
    "QR_BATCH_NOT_FOUND": {
        "en": "QR batch not found.",
        "fr": "Lot QR introuvable.",
        "de": "QR-Charge nicht gefunden.",
        "es": "Lote de QR no encontrado.",
        "pl": "Nie znaleziono partii kodów QR.",
    },
    "QR_TOKEN_NOT_FOUND": {
        "en": "QR token does not exist.",
        "fr": "Le jeton QR n'existe pas.",
        "de": "QR-Token existiert nicht.",
        "es": "El código QR no existe.",
        "pl": "Ten kod QR nie istnieje.",
    },
    "QR_TOKEN_ALREADY_LINKED": {
        "en": "This QR code is already linked to a hive.",
        "fr": "Ce code QR est déjà lié à une ruche.",
        "de": "Dieser QR-Code ist bereits mit einem Volk verknüpft.",
        "es": "Este código QR ya está vinculado a una colmena.",
        "pl": "Ten kod QR jest już przypisany do rodziny pszczelej.",
    },
    "APIARY_HAS_HIVES": {
        "en": "Cannot delete an apiary that still contains hives.",
        "fr": "Impossible de supprimer un rucher qui contient encore des ruches.",
        "de": "Ein Bienenstand mit Völkern kann nicht gelöscht werden.",
        "es": "No se puede eliminar un colmenar que aún contiene colmenas.",
        "pl": "Nie można usunąć pasieki, w której nadal są rodziny pszczele.",
    },
    "QR_BATCH_IN_USE": {
        "en": "This batch contains codes that are attached to hives and cannot be deleted.",
        "fr": "Ce lot contient des codes associés à des ruches et ne peut pas être supprimé.",
        "de": "Diese Charge enthält Codes, die Völkern zugeordnet sind, und kann nicht gelöscht werden.",
        "es": "Este lote contiene códigos asociados a colmenas y no se puede eliminar.",
        "pl": "Ta partia zawiera kody przypisane do rodzin pszczelich i nie można jej usunąć.",
    },
    "TREATMENT_NOT_FOUND": {
        "en": "This treatment does not exist.",
        "fr": "Ce traitement n'existe pas.",
        "de": "Diese Behandlung gibt es nicht.",
        "es": "Este tratamiento no existe.",
        "pl": "Ten zabieg nie istnieje.",
    },
    "NOTHING_TO_MOVE": {
        "en": "These hives already stand there.",
        "fr": "Ces ruches sont déjà à cet endroit.",
        "de": "Diese Völker stehen schon dort.",
        "es": "Estas colmenas ya están ahí.",
        "pl": "Te rodziny pszczele już tam stoją.",
    },
    "OWNER_ONLY": {
        "en": "Only the owner can do this.",
        "fr": "Seul le propriétaire peut faire cela.",
        "de": "Das kann nur der Besitzer.",
        "es": "Solo el propietario puede hacer esto.",
        "pl": "Może to zrobić tylko właściciel.",
    },
    "SHARE_NOT_FOUND": {
        "en": "This invitation does not exist.",
        "fr": "Cette invitation n'existe pas.",
        "de": "Diese Einladung gibt es nicht.",
        "es": "Esta invitación no existe.",
        "pl": "To zaproszenie nie istnieje.",
    },
    "SHARE_TOKEN_INVALID": {
        "en": "This invitation link is no longer valid.",
        "fr": "Ce lien d'invitation n'est plus valide.",
        "de": "Dieser Einladungslink ist nicht mehr gültig.",
        "es": "Este enlace de invitación ya no es válido.",
        "pl": "Ten link z zaproszeniem już nie jest ważny.",
    },
    "SHARE_ALREADY_EXISTS": {
        "en": "This address has already been invited or already has access.",
        "fr": "Cette adresse a déjà été invitée ou a déjà accès.",
        "de": "Diese Adresse wurde bereits eingeladen oder hat schon Zugriff.",
        "es": "Esta dirección ya ha sido invitada o ya tiene acceso.",
        "pl": "Ten adres został już zaproszony lub ma już dostęp.",
    },
    "SHARE_WITH_SELF": {
        "en": "You cannot invite yourself.",
        "fr": "Vous ne pouvez pas vous inviter vous-même.",
        "de": "Du kannst dich nicht selbst einladen.",
        "es": "No puedes invitarte a ti mismo.",
        "pl": "Nie możesz zaprosić samego siebie.",
    },
    "EMAIL_ALREADY_REGISTERED": {
        "en": "This email address is already registered.",
        "fr": "Cette adresse email est déjà enregistrée.",
        "de": "Diese E-Mail-Adresse ist bereits registriert.",
        "es": "Esta dirección de correo ya está registrada.",
        "pl": "Ten adres e-mail jest już zarejestrowany.",
    },
    "QR_BATCH_LIMIT_EXCEEDED": {
        "en": "Count must be between 1 and 50.",
        "fr": "Le nombre doit être compris entre 1 et 50.",
        "de": "Die Anzahl muss zwischen 1 und 50 liegen.",
        "es": "La cantidad debe estar entre 1 y 50.",
        "pl": "Liczba musi mieścić się między 1 a 50.",
    },
    "RESET_TOKEN_INVALID": {
        "en": "This password reset link is invalid or has expired.",
        "fr": "Ce lien de réinitialisation est invalide ou a expiré.",
        "de": "Dieser Passwort-Reset-Link ist ungültig oder abgelaufen.",
        "es": "Este enlace para restablecer la contraseña no es válido o ha caducado.",
        "pl": "Ten link do resetowania hasła jest nieprawidłowy lub wygasł.",
    },
    # -- Validation (422) -------------------------------------------------------
    #
    # A rejected field used to leave the server in pydantic's own English -- "Input should be
    # less than or equal to 10" -- and lib/api.ts joins those straight into what the beekeeper
    # reads. So the one place a user is most likely to end up was the one place five languages
    # did not reach (#446). app/validation.py turns a pydantic error into one of these.
    #
    # {field} is filled from the FIELD_* entries below, {limit} from pydantic's own ctx.
    "VALIDATION_TOO_LARGE": {
        "en": "{field}: at most {limit}.",
        "de": "{field}: höchstens {limit}.",
        "fr": "{field} : au maximum {limit}.",
        "es": "{field}: como máximo {limit}.",
        "pl": "{field}: najwyżej {limit}.",
    },
    "VALIDATION_TOO_SMALL": {
        "en": "{field}: at least {limit}.",
        "de": "{field}: mindestens {limit}.",
        "fr": "{field} : au minimum {limit}.",
        "es": "{field}: al menos {limit}.",
        "pl": "{field}: co najmniej {limit}.",
    },
    "VALIDATION_TOO_LONG": {
        "en": "{field}: at most {limit} characters.",
        "de": "{field}: höchstens {limit} Zeichen.",
        "fr": "{field} : au maximum {limit} caractères.",
        "es": "{field}: como máximo {limit} caracteres.",
        "pl": "{field}: najwyżej {limit} znaków.",
    },
    "VALIDATION_TOO_SHORT": {
        "en": "{field}: at least {limit} characters.",
        "de": "{field}: mindestens {limit} Zeichen.",
        "fr": "{field} : au minimum {limit} caractères.",
        "es": "{field}: al menos {limit} caracteres.",
        "pl": "{field}: co najmniej {limit} znaków.",
    },
    "VALIDATION_DATE_IN_FUTURE": {
        "en": "{field} cannot be in the future.",
        "de": "{field} kann nicht in der Zukunft liegen.",
        "fr": "{field} ne peut pas être dans le futur.",
        "es": "{field} no puede estar en el futuro.",
        "pl": "{field} nie może być w przyszłości.",
    },
    # For a day that is *meant* to be in the future -- a planned treatment -- where the
    # ceiling is far rather than today.
    "VALIDATION_DATE_TOO_LATE": {
        "en": "{field} cannot be after {limit}.",
        "de": "{field} kann nicht nach {limit} liegen.",
        "fr": "{field} ne peut pas être postérieur à {limit}.",
        "es": "{field} no puede ser posterior a {limit}.",
        "pl": "{field} nie może być późniejsza niż {limit}.",
    },
    "VALIDATION_DATE_TOO_EARLY": {
        "en": "{field} cannot be before {limit}.",
        "de": "{field} kann nicht vor {limit} liegen.",
        "fr": "{field} ne peut pas être antérieur à {limit}.",
        "es": "{field} no puede ser anterior a {limit}.",
        "pl": "{field} nie może być wcześniejsza niż {limit}.",
    },
    "VALIDATION_REQUIRED": {
        "en": "{field} is required.",
        "de": "{field} ist erforderlich.",
        "fr": "{field} est obligatoire.",
        "es": "{field} es obligatorio.",
        "pl": "{field} jest wymagane.",
    },
    "VALIDATION_NOT_A_NUMBER": {
        "en": "{field} must be a number.",
        "de": "{field} muss eine Zahl sein.",
        "fr": "{field} doit être un nombre.",
        "es": "{field} debe ser un número.",
        "pl": "{field} musi być liczbą.",
    },
    # Phrased as a label and not a sentence, because the field this fires on most is itself
    # called Date: "Date must be a date in the form ..." says it twice.
    "VALIDATION_NOT_A_DATE": {
        "en": "{field}: a date in the form YYYY-MM-DD.",
        "de": "{field}: ein Datum in der Form JJJJ-MM-TT.",
        "fr": "{field} : une date au format AAAA-MM-JJ.",
        "es": "{field}: una fecha con el formato AAAA-MM-DD.",
        "pl": "{field}: data w formacie RRRR-MM-DD.",
    },
    "VALIDATION_NOT_ALLOWED": {
        "en": "{field} has a value that is not allowed.",
        "de": "{field} hat einen Wert, der nicht zulässig ist.",
        "fr": "{field} a une valeur non autorisée.",
        "es": "{field} tiene un valor no permitido.",
        "pl": "{field} ma niedozwoloną wartość.",
    },
    "VALIDATION_INVALID": {
        "en": "{field} is not valid.",
        "de": "{field} ist ungültig.",
        "fr": "{field} n'est pas valide.",
        "es": "{field} no es válido.",
        "pl": "{field} jest nieprawidłowe.",
    },

    # -- Field names, as the screens say them -----------------------------------
    #
    # The server has to translate these, because it is the one naming the field in a validation
    # message. The vocabulary per language is fixed in CLAUDE.md: Bienenstand / Volk / Kontrolle,
    # rucher / ruche / visite, colmenar / colmena / revisión, pasieka / rodzina pszczela / przegląd.
    #
    # A field with no entry here falls back to its own name with the underscores taken out, which
    # is readable English and better than nothing -- see app/validation.py.
    "FIELD_ACQUISITION_DATE": {
        "en": "Acquisition date", "de": "Anschaffungsdatum",
        "fr": "Date d'acquisition", "es": "Fecha de adquisición",
        "pl": "Data nabycia",
    },
    "FIELD_DATE": {
        "en": "Date", "de": "Datum", "fr": "Date", "es": "Fecha", "pl": "Data",
    },
    "FIELD_BROOD_FRAMES": {
        "en": "Brood frames", "de": "Brutwaben", "fr": "Cadres de couvain",
        "es": "Cuadros de cría", "pl": "Ramki z czerwiem",
    },
    "FIELD_HONEY_FRAMES": {
        "en": "Honey frames", "de": "Honigwaben", "fr": "Cadres de miel",
        "es": "Cuadros de miel", "pl": "Ramki z miodem",
    },
    "FIELD_POPULATION_STRENGTH": {
        "en": "Colony strength", "de": "Volksstärke", "fr": "Force de la colonie",
        "es": "Fuerza de la colonia", "pl": "Siła rodziny",
    },
    "FIELD_VARROA_LEVEL": {
        "en": "Varroa level", "de": "Varroa-Belastung", "fr": "Niveau de varroa",
        "es": "Nivel de varroa", "pl": "Poziom warrozy",
    },
    "FIELD_VARROA_COUNT": {
        "en": "Varroa count", "de": "Varroa-Zahl", "fr": "Nombre de varroas",
        "es": "Recuento de varroa", "pl": "Liczba warrozy",
    },
    "FIELD_WEIGHT_KG": {
        "en": "Weight", "de": "Gewicht", "fr": "Poids", "es": "Peso", "pl": "Waga",
    },
    "FIELD_NOTES": {
        "en": "Notes", "de": "Notizen", "fr": "Notes", "es": "Notas", "pl": "Notatki",
    },
    "FIELD_NOTE": {
        "en": "Note", "de": "Notiz", "fr": "Note", "es": "Nota", "pl": "Notatka",
    },
    "FIELD_TREATMENT_APPLIED": {
        "en": "Treatment applied", "de": "Behandlung", "fr": "Traitement appliqué",
        "es": "Tratamiento aplicado", "pl": "Zastosowane leczenie",
    },
    "FIELD_FEEDING_TYPE": {
        "en": "Feed", "de": "Futter", "fr": "Nourrissement", "es": "Alimento", "pl": "Pokarm",
    },
    "FIELD_QUEEN_COLOR": {
        "en": "Queen colour", "de": "Königinnenfarbe", "fr": "Couleur de la reine",
        "es": "Color de la reina", "pl": "Kolor matki",
    },
    "FIELD_MOOD": {
        "en": "Temperament", "de": "Sanftmut", "fr": "Comportement",
        "es": "Temperamento", "pl": "Nastrój rodziny",
    },
    "FIELD_LATITUDE": {
        "en": "Latitude", "de": "Breitengrad", "fr": "Latitude",
        "es": "Latitud", "pl": "Szerokość geograficzna",
    },
    "FIELD_LONGITUDE": {
        "en": "Longitude", "de": "Längengrad", "fr": "Longitude",
        "es": "Longitud", "pl": "Długość geograficzna",
    },
    "FIELD_NAME": {
        "en": "Name", "de": "Name", "fr": "Nom", "es": "Nombre", "pl": "Nazwa",
    },
    "FIELD_DESCRIPTION": {
        "en": "Description", "de": "Beschreibung", "fr": "Description",
        "es": "Descripción", "pl": "Opis",
    },
    "FIELD_ADDRESS": {
        "en": "Address", "de": "Adresse", "fr": "Adresse", "es": "Dirección", "pl": "Adres",
    },
    "FIELD_COUNT": {
        "en": "Count", "de": "Anzahl", "fr": "Nombre", "es": "Cantidad", "pl": "Liczba",
    },
    "FIELD_CAUGHT_ON": {
        "en": "Catch date", "de": "Fangdatum", "fr": "Date de capture",
        "es": "Fecha de captura", "pl": "Data odłowu",
    },
    "FIELD_DONE_ON": {
        "en": "Completion date", "de": "Erledigt am", "fr": "Date de réalisation",
        "es": "Fecha de realización", "pl": "Data wykonania",
    },
    "FIELD_MOVED_ON": {
        "en": "Move date", "de": "Umzugsdatum", "fr": "Date du déplacement",
        "es": "Fecha del traslado", "pl": "Data przeniesienia",
    },
    "FIELD_DUE_ON": {
        "en": "Due date", "de": "Fällig am", "fr": "Échéance",
        "es": "Fecha prevista", "pl": "Termin",
    },
    "FIELD_PRODUCT": {
        "en": "Product", "de": "Mittel", "fr": "Produit", "es": "Producto", "pl": "Preparat",
    },
    "FIELD_PASSWORD": {
        "en": "Password", "de": "Passwort", "fr": "Mot de passe",
        "es": "Contraseña", "pl": "Hasło",
    },
    "FIELD_NEW_PASSWORD": {
        "en": "New password", "de": "Neues Passwort", "fr": "Nouveau mot de passe",
        "es": "Nueva contraseña", "pl": "Nowe hasło",
    },
    "FIELD_EMAIL": {
        "en": "Email address", "de": "E-Mail-Adresse", "fr": "Adresse e-mail",
        "es": "Correo electrónico", "pl": "Adres e-mail",
    },
    "FIELD_REPORTER_NAME": {
        "en": "Your name", "de": "Dein Name", "fr": "Votre nom",
        "es": "Tu nombre", "pl": "Twoje imię",
    },
    "FIELD_POSTAL_CODE": {
        "en": "Postal code", "de": "Postleitzahl", "fr": "Code postal",
        "es": "Código postal", "pl": "Kod pocztowy",
    },
    "FIELD_YEARS_KEEPING": {
        "en": "Years of beekeeping", "de": "Jahre Imkererfahrung", "fr": "Années d'apiculture",
        "es": "Años de apicultura", "pl": "Lata pszczelarstwa",
    },
    "FIELD_REMINDER_INTERVAL_DAYS": {
        "en": "Reminder interval", "de": "Erinnerungsabstand", "fr": "Intervalle de rappel",
        "es": "Intervalo de recordatorio", "pl": "Odstęp przypomnień",
    },
}


SUPPORTED_LANGUAGES = ("en", "de", "fr", "es", "pl")


def get_message(code: str, accept_language: Optional[str] = None) -> str:
    lang = "en"
    if accept_language:
        for part in accept_language.split(","):
            tag = part.strip().split(";")[0].strip()[:2].lower()
            # "es" used to be missing here, so Spanish clients got English even for
            # the messages that did have a Spanish translation.
            if tag in SUPPORTED_LANGUAGES:
                lang = tag
                break
    messages = MESSAGES.get(code, {})
    return messages.get(lang, messages.get("en", code))


def error(code: str, accept_language: Optional[str] = None) -> dict:
    return {"code": code, "message": get_message(code, accept_language)}
