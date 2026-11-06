// ONLY AI: the first EmailScreen Claude wrote, before any review.
//
// What changed in review, and why:
//
// 1. subtitle, disclaimer, bookDemoLink, errorMessage used iOS predicate strings
//    that matched on visible text (label). The Inspector XML shows each of these
//    elements already has an accessibility ID (its `name`), so they became `~id`.
//    Predicates were written from what the screen showed, not from the real tree.
//
// 2. disclaimer used `label BEGINSWITH "Perchwell is only available"`. The reviewed
//    version uses the full accessibility ID, kept in a DISCLAIMER constant so the
//    getter stays one short line.
//
// 3. Predicates kept on purpose, both confirmed against the XML:
//    - header: '~Perchwell' also matches the Application and the NavigationBar.
//    - errorSnack: the snack and its icon share 'UITests.snackViews.error'.
//
// 4. Missing element: openInSafariButton ('~Open'). Tapping the link opens the iOS
//    link preview menu, not Safari, so the book-a-demo spec failed with "Safari did
//    not come to the foreground". The human found the fix: tap Open in that menu.
//    The AI first suspected the locator, then tried a short tap, which also failed.
class EmailScreenOnlyAI {
    get closeButton() {
        return $('~UITests.buttons.close');
    }

    // '~Perchwell' also matches the app and the navigation bar, so narrow by type
    get header() {
        return $('-ios predicate string:type == "XCUIElementTypeStaticText" AND label == "Perchwell"');
    }

    // REVIEWED: $('~Sign in to unlock all the features')
    get subtitle() {
        return $('-ios predicate string:label == "Sign in to unlock all the features"');
    }

    get emailField() {
        return $('~UITests.textfields.auth.email');
    }

    // REVIEWED: $(`~${DISCLAIMER}`), the full text is the accessibility ID
    get disclaimer() {
        return $('-ios predicate string:type == "XCUIElementTypeTextView" AND label BEGINSWITH "Perchwell is only available"');
    }

    // REVIEWED: $('~Perchwell.com')
    get bookDemoLink() {
        return $('-ios predicate string:type == "XCUIElementTypeLink" AND label == "Perchwell.com"');
    }

    // REVIEWED: added openInSafariButton -> $('~Open')

    get continueButton() {
        return $('~UITests.buttons.next');
    }

    // The container and its icon share this ID, so narrow to the container by type
    get errorSnack() {
        return $('-ios predicate string:name == "UITests.snackViews.error" AND type == "XCUIElementTypeOther"');
    }

    // REVIEWED: $('~Invalid email')
    get errorMessage() {
        return $('-ios predicate string:type == "XCUIElementTypeStaticText" AND label == "Invalid email"');
    }

    async waitForScreen() {
        await this.emailField.waitForDisplayed();
    }

    async enterEmail(email: string) {
        await this.emailField.setValue(email);
    }

    async submit() {
        await this.continueButton.click();
    }

    async close() {
        await this.closeButton.click();
    }
}

export default new EmailScreenOnlyAI();
