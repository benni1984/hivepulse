from typing import Optional

MESSAGES = {
    "INVALID_CREDENTIALS": {
        "en": "Invalid email or password.",
        "fr": "Email ou mot de passe invalide.",
        "de": "Ungültige E-Mail oder Passwort.",
        "es": "Correo electrónico o contraseña no válidos.",
    },
    "INVALID_IDENTITY_TOKEN": {
        "en": "That sign-in could not be verified. Please try again.",
        "fr": "Cette connexion n'a pas pu être vérifiée. Veuillez réessayer.",
        "de": "Diese Anmeldung konnte nicht bestätigt werden. Bitte versuche es erneut.",
        "es": "No se ha podido verificar este inicio de sesión. Inténtalo de nuevo.",
    },
    "EMAIL_NOT_VERIFIED": {
        "en": "Your provider has not confirmed this email address.",
        "fr": "Votre fournisseur n'a pas confirmé cette adresse e-mail.",
        "de": "Dein Anbieter hat diese E-Mail-Adresse nicht bestätigt.",
        "es": "Tu proveedor no ha confirmado esta dirección de correo.",
    },
    "SOCIAL_SIGN_IN_UNCONFIGURED": {
        "en": "Signing in this way is not available yet.",
        "fr": "Cette méthode de connexion n'est pas encore disponible.",
        "de": "Diese Anmeldeart steht noch nicht zur Verfügung.",
        "es": "Este modo de inicio de sesión aún no está disponible.",
    },
    "NO_PASSWORD_SET": {
        "en": "This account signs in with Apple or Google and has no password. Use \"Forgot password\" to set one.",
        "fr": "Ce compte se connecte avec Apple ou Google et n'a pas de mot de passe. Utilisez \"Mot de passe oublié\" pour en définir un.",
        "de": "Dieses Konto meldet sich mit Apple oder Google an und hat kein Passwort. Über \"Passwort vergessen\" lässt sich eines festlegen.",
        "es": "Esta cuenta inicia sesión con Apple o Google y no tiene contraseña. Usa \"Olvidé mi contraseña\" para crear una.",
    },
    "TOKEN_EXPIRED": {
        "en": "Access token has expired.",
        "fr": "Le jeton d'accès a expiré.",
        "de": "Das Zugriffstoken ist abgelaufen.",
        "es": "El token de acceso ha caducado.",
    },
    "TOKEN_INVALID": {
        "en": "Could not validate credentials.",
        "fr": "Impossible de valider les informations d'identification.",
        "de": "Anmeldeinformationen konnten nicht überprüft werden.",
        "es": "No se han podido validar las credenciales.",
    },
    "FORBIDDEN": {
        "en": "You do not have permission to access this resource.",
        "fr": "Vous n'avez pas la permission d'accéder à cette ressource.",
        "de": "Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.",
        "es": "No tienes permiso para acceder a este recurso.",
    },
    "USER_NOT_FOUND": {
        "en": "User not found.",
        "fr": "Utilisateur introuvable.",
        "de": "Benutzer nicht gefunden.",
        "es": "Usuario no encontrado.",
    },
    "APIARY_NOT_FOUND": {
        "en": "Apiary not found.",
        "fr": "Rucher introuvable.",
        "de": "Bienenstand nicht gefunden.",
        "es": "Colmenar no encontrado.",
    },
    "HIVE_NOT_FOUND": {
        "en": "Hive not found.",
        "fr": "Ruche introuvable.",
        "de": "Bienenstock nicht gefunden.",
        "es": "Colmena no encontrada.",
    },
    "INSPECTION_NOT_FOUND": {
        "en": "Inspection not found.",
        "fr": "Inspection introuvable.",
        "de": "Inspektion nicht gefunden.",
        "es": "Inspección no encontrada.",
    },
    "FIELD_DEFINITION_NOT_FOUND": {
        "en": "Field definition not found.",
        "fr": "Définition de champ introuvable.",
        "de": "Felddefinition nicht gefunden.",
        "es": "Definición de campo no encontrada.",
    },
    "QR_BATCH_NOT_FOUND": {
        "en": "QR batch not found.",
        "fr": "Lot QR introuvable.",
        "de": "QR-Charge nicht gefunden.",
        "es": "Lote de QR no encontrado.",
    },
    "QR_TOKEN_NOT_FOUND": {
        "en": "QR token does not exist.",
        "fr": "Le jeton QR n'existe pas.",
        "de": "QR-Token existiert nicht.",
        "es": "El código QR no existe.",
    },
    "QR_TOKEN_ALREADY_LINKED": {
        "en": "This QR code is already linked to a hive.",
        "fr": "Ce code QR est déjà lié à une ruche.",
        "de": "Dieser QR-Code ist bereits mit einem Bienenstock verknüpft.",
        "es": "Este código QR ya está vinculado a una colmena.",
    },
    "APIARY_HAS_HIVES": {
        "en": "Cannot delete an apiary that still contains hives.",
        "fr": "Impossible de supprimer un rucher qui contient encore des ruches.",
        "de": "Ein Bienenstand mit Bienenstöcken kann nicht gelöscht werden.",
        "es": "No se puede eliminar un colmenar que aún contiene colmenas.",
    },
    "QR_BATCH_IN_USE": {
        "en": "This batch contains codes that are attached to hives and cannot be deleted.",
        "fr": "Ce lot contient des codes associés à des ruches et ne peut pas être supprimé.",
        "de": "Diese Charge enthält Codes, die Bienenstöcken zugeordnet sind, und kann nicht gelöscht werden.",
        "es": "Este lote contiene códigos asociados a colmenas y no se puede eliminar.",
    },
    "TREATMENT_NOT_FOUND": {
        "en": "This treatment does not exist.",
        "fr": "Ce traitement n'existe pas.",
        "de": "Diese Behandlung gibt es nicht.",
        "es": "Este tratamiento no existe.",
    },
    "NOTHING_TO_MOVE": {
        "en": "These hives already stand there.",
        "fr": "Ces ruches sont déjà à cet endroit.",
        "de": "Diese Völker stehen schon dort.",
        "es": "Estas colmenas ya están ahí.",
    },
    "OWNER_ONLY": {
        "en": "Only the owner can do this.",
        "fr": "Seul le propriétaire peut faire cela.",
        "de": "Das kann nur der Besitzer.",
        "es": "Solo el propietario puede hacer esto.",
    },
    "SHARE_NOT_FOUND": {
        "en": "This invitation does not exist.",
        "fr": "Cette invitation n'existe pas.",
        "de": "Diese Einladung gibt es nicht.",
        "es": "Esta invitación no existe.",
    },
    "SHARE_TOKEN_INVALID": {
        "en": "This invitation link is no longer valid.",
        "fr": "Ce lien d'invitation n'est plus valide.",
        "de": "Dieser Einladungslink ist nicht mehr gültig.",
        "es": "Este enlace de invitación ya no es válido.",
    },
    "SHARE_ALREADY_EXISTS": {
        "en": "This address has already been invited or already has access.",
        "fr": "Cette adresse a déjà été invitée ou a déjà accès.",
        "de": "Diese Adresse wurde bereits eingeladen oder hat schon Zugriff.",
        "es": "Esta dirección ya ha sido invitada o ya tiene acceso.",
    },
    "SHARE_WITH_SELF": {
        "en": "You cannot invite yourself.",
        "fr": "Vous ne pouvez pas vous inviter vous-même.",
        "de": "Du kannst dich nicht selbst einladen.",
        "es": "No puedes invitarte a ti mismo.",
    },
    "EMAIL_ALREADY_REGISTERED": {
        "en": "This email address is already registered.",
        "fr": "Cette adresse email est déjà enregistrée.",
        "de": "Diese E-Mail-Adresse ist bereits registriert.",
        "es": "Esta dirección de correo ya está registrada.",
    },
    "QR_BATCH_LIMIT_EXCEEDED": {
        "en": "Count must be between 1 and 50.",
        "fr": "Le nombre doit être compris entre 1 et 50.",
        "de": "Die Anzahl muss zwischen 1 und 50 liegen.",
        "es": "La cantidad debe estar entre 1 y 50.",
    },
    "RESET_TOKEN_INVALID": {
        "en": "This password reset link is invalid or has expired.",
        "fr": "Ce lien de réinitialisation est invalide ou a expiré.",
        "de": "Dieser Passwort-Reset-Link ist ungültig oder abgelaufen.",
        "es": "Este enlace para restablecer la contraseña no es válido o ha caducado.",
    },
}


SUPPORTED_LANGUAGES = ("en", "de", "fr", "es")


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
