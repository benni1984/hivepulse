import Foundation

/// Finds the invitation token in whatever somebody pastes: the whole link from the email, or just the token.
///
/// An invitation to an address that had no account is taken with the token from the email's link. The
/// website does that by itself; in the app the link is pasted, and people paste more than they should.
enum InvitationLink {

    static func token(from text: String) -> String? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        if let range = trimmed.range(of: "token=") {
            let rest = trimmed[range.upperBound...]
            let token = rest.prefix { isTokenCharacter($0) }
            return isPlausible(String(token)) ? String(token) : nil
        }
        return isPlausible(trimmed) ? trimmed : nil
    }

    // The server issues 256-bit url-safe tokens; anything much shorter is not one, and sending it would only be refused.
    private static func isPlausible(_ candidate: String) -> Bool {
        candidate.count >= 20 && candidate.count <= 200 && candidate.allSatisfy(isTokenCharacter)
    }

    private static func isTokenCharacter(_ character: Character) -> Bool {
        character.isASCII && (character.isLetter || character.isNumber || character == "-" || character == "_")
    }
}
