import SwiftUI

/// One question, once, three days in (#546).
///
/// Google refused Play production access twice, the second time because no feedback came out of
/// the closed test. The iPhone is not what that judgement is about, but the cause is the same on
/// both: the only way to say anything was Settings → Send feedback, sixth of thirteen rows, and
/// nobody scrolls into Settings to volunteer an opinion. So the application asks.
///
/// The words are the same as Android's, which `scripts/check_i18n.py` holds in place. The button
/// differs on purpose: Android opens its Play Store page, because an answer written there is
/// what reaches the Play Console. Here it is the mail Settings already offers.
struct FeedbackPromptCard: View {
    /// Called by both buttons. Whichever one is pressed, the question is over for good.
    let onAnswered: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("feedback.askTitle", comment: ""))
                .font(.headline)
            Text(NSLocalizedString("feedback.askBody", comment: ""))
                .font(.subheadline)
                .foregroundColor(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 12) {
                Link(destination: FeedbackMail.url) {
                    Text(NSLocalizedString("action.feedback", comment: ""))
                }
                .buttonStyle(HPPrimaryButtonStyle())
                .simultaneousGesture(TapGesture().onEnded { onAnswered() })
                .accessibilityIdentifier("feedbackPromptSend")

                Button(NSLocalizedString("feedback.askDismiss", comment: ""), action: onAnswered)
                    .buttonStyle(.borderless)
                    .accessibilityIdentifier("feedbackPromptDismiss")
            }
        }
        .padding(.vertical, 4)
        .accessibilityIdentifier("feedbackPromptCard")
    }
}
