// Android sign-in step 1: enter an email and continue. The first screen after launch
// when logged out: Android has no landing screen and no close button.
//
// The app is Jetpack Compose with no test tags, so nodes have no resource-id.
// Locators match on visible text and class (checked against the page source on a Moto X4).
const byText = (text: string) => $(`android=new UiSelector().text("${text}")`);
// Android breaks the line after "clients." (a space, then a newline), and text() must match exactly
const disclaimerText =
    'Perchwell is only available for real estate professionals and their clients. \n' +
    'If you are an agent interested in Perchwell, please book a demo at Perchwell.com';

class EmailScreen {
    
    // The logo: an ImageView whose content-desc is "Perchwell"
    get header() {
        return $('~Perchwell');
    }

    // Subtitle - Android wording differs from iOS ("...all the features")
    get subtitle() {
        return byText('Sign in to unlock all features');
    }

    // The Email Text Field
    get emailField() {
        return $('android=new UiSelector().className("android.widget.EditText")');
    }

    // Disclaimer message
    get disclaimer() {
        return $(`android=new UiSelector().text("${disclaimerText}")`);
    }

    // The text sits inside the clickable container, so tapping it taps the button
    get continueButton() {
        return byText('Continue');
    }

    // Errors are inline under the field and stay until the next submit
    get emptyEmailError() {
        return byText('Please enter an email address');
    }

    get invalidEmailError() {
        return byText('Please enter your email in format: user@emailclient.com');
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

    // "Perchwell.com" is a link span at the end of the disclaimer, not its own node,
    // so tap where it sits in the text. Measured on the Moto X4 (1080x1920): the text
    // wraps to 4 lines and the link covers about 54-87% of the last line's width.
    // Another screen size or font scale can wrap the text differently.
    async tapBookDemoLink() {
        const {x, y, width, height} = await this.disclaimer.getElementRect(await this.disclaimer.elementId);
        await driver.execute('mobile: clickGesture', {
            x: Math.round(x + width * 0.7),
            y: Math.round(y + height * 7 / 8),
        });
    }
}

export default new EmailScreen();
