// First screen after launch when logged out: background image and a Sign in button.
class LandingScreen {
    get signInButton() {
        return $('~UITests.buttons.landing.signin');
    }

    async waitForScreen() {
        await this.signInButton.waitForDisplayed();
    }

    async signIn() {
        await this.signInButton.click();
    }
}

export default new LandingScreen();
