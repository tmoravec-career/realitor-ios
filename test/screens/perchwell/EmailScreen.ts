// Sign-in step 1: enter an email and continue. Opened from the landing screen.

// The disclaimer's accessibility ID is its full text
const DISCLAIMER =
    'Perchwell is only available for real estate professionals and their clients. ' +
    'If you are an agent interested in Perchwell, please book a demo at Perchwell.com';

class EmailScreen {
    get closeButton() {
        return $('~UITests.buttons.close');
    }

    // '~Perchwell' also matches the app and the navigation bar, so narrow by type
    get header() {
        return $('-ios predicate string:name == "Perchwell" AND type == "XCUIElementTypeStaticText"');
    }

    get subtitle() {
        return $('~Sign in to unlock all the features');
    }

    get emailField() {
        return $('~UITests.textfields.auth.email');
    }

    get disclaimer() {
        return $(`~${DISCLAIMER}`);
    }

    get bookDemoLink() {
        return $('~Perchwell.com');
    }

    get openInSafariButton() {
        return $('~Open');
    }

    get continueButton() {
        return $('~UITests.buttons.next');
    }

    // The snack and its icon share this ID, so narrow to the snack by type
    get errorSnack() {
        return $('-ios predicate string:name == "UITests.snackViews.error" AND type == "XCUIElementTypeOther"');
    }

    get errorMessage() {
        return $('~Invalid email');
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

export default new EmailScreen();
