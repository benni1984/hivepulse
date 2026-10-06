package com.hivepulse.app.ui.sharing

/**
 * Finds the invitation token in whatever somebody pastes: the whole link from the email, or just
 * the token.
 *
 * An invitation to an address that had no account is taken with the token from the email's link.
 * The website does that by itself; in the app the link is pasted, and people paste more than they should.
 */
object InvitationLink {

    fun token(text: String): String? {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return null

        val marker = "token="
        val at = trimmed.indexOf(marker)
        if (at >= 0) {
            val candidate = trimmed.substring(at + marker.length).takeWhile(::isTokenCharacter)
            return candidate.takeIf(::isPlausible)
        }
        return trimmed.takeIf(::isPlausible)
    }

    // The server issues 256-bit url-safe tokens; anything much shorter is not one, and sending it would only be refused.
    private fun isPlausible(candidate: String) =
        candidate.length in 20..200 && candidate.all(::isTokenCharacter)

    private fun isTokenCharacter(c: Char) =
        c in 'a'..'z' || c in 'A'..'Z' || c in '0'..'9' || c == '-' || c == '_'
}
