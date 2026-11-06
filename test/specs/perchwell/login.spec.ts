import LandingScreen from '../../screens/perchwell/LandingScreen.ts';
import EmailScreen from '../../screens/perchwell/EmailScreen.ts';
import {AppState, appId, restartApp} from '../../support/app.ts';

// Production app, logged out. Only emails the app rejects on its own:
// nothing here reaches Perchwell's servers.
describe('Perchwell sign in', () => {
    beforeEach(async () => {
        await restartApp();
        await LandingScreen.waitForScreen();
    });

    it('opens the email screen and closes back to the landing screen', async () => {
        await LandingScreen.signIn();
        await EmailScreen.waitForScreen();

        await expect(EmailScreen.header).toBeDisplayed();
        await expect(EmailScreen.subtitle).toBeDisplayed();
        await expect(EmailScreen.disclaimer).toBeDisplayed();
        await expect(EmailScreen.continueButton).toBeDisplayed();

        await EmailScreen.close();
        await expect(LandingScreen.signInButton).toBeDisplayed();
    });

    it('shows "Invalid email" for an empty email and hides it on its own', async () => {
        await LandingScreen.signIn();
        await EmailScreen.waitForScreen();

        await EmailScreen.submit();

        await expect(EmailScreen.errorMessage).toBeDisplayed();
        // No usable close button: the snack must dismiss itself
        await EmailScreen.errorSnack.waitForDisplayed({reverse: true, timeout: 10000});
        await expect(EmailScreen.emailField).toBeDisplayed();
    });

    it('shows "Invalid email" for a badly formatted email', async () => {
        await LandingScreen.signIn();
        await EmailScreen.waitForScreen();

        await EmailScreen.enterEmail('not-an-email');
        await EmailScreen.submit();

        await expect(EmailScreen.errorMessage).toBeDisplayed();
        await EmailScreen.errorSnack.waitForDisplayed({reverse: true, timeout: 10000});
    });

    it('keeps the typed email after going to the background and back', async () => {
        const email = 'qa.lifecycle@example.com';
        await LandingScreen.signIn();
        await EmailScreen.waitForScreen();
        await EmailScreen.enterEmail(email);

        // Home screen for 3 seconds, then back to the app
        await driver.background(3);

        expect(await driver.queryAppState(appId())).toBe(AppState.RUNNING_IN_FOREGROUND);
        await expect(EmailScreen.emailField).toHaveAttribute('value', email);
    });
});
