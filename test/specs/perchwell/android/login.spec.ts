import EmailScreen from '../../../screens/perchwell/android/EmailScreen.ts';
import {AppState, appId, restartApp} from '../../../support/app.ts';

// The locator only matches the start, so check the whole text here.
// Android breaks the line after "clients." (a space, then a newline); iOS doesn't
const DISCLAIMER =
    'Perchwell is only available for real estate professionals and their clients. \n' +
    'If you are an agent interested in Perchwell, please book a demo at Perchwell.com';

// Production app, logged out. Only emails the app rejects on its own:
// nothing here reaches Perchwell's servers.
describe('Perchwell sign in (Android)', () => {
    beforeEach(async () => {
        await restartApp();
        await EmailScreen.waitForScreen();
    });

    it('opens on the email screen', async () => {
        await expect(EmailScreen.header).toBeDisplayed();
        await expect(EmailScreen.subtitle).toBeDisplayed();
        await expect(EmailScreen.disclaimer).toBeDisplayed();
        await expect(EmailScreen.disclaimer).toHaveText(DISCLAIMER);
        await expect(EmailScreen.continueButton).toBeDisplayed();
    });

    it('asks for an email when the field is empty', async () => {
        await EmailScreen.submit();

        await expect(EmailScreen.emptyEmailError).toBeDisplayed();
    });

    it('asks for the right format for a badly formatted email', async () => {
        await EmailScreen.enterEmail('not-an-email');
        await EmailScreen.submit();

        await expect(EmailScreen.invalidEmailError).toBeDisplayed();
    });

    it('keeps the typed email after going to the background and back', async () => {
        const email = 'qa.lifecycle@example.com';
        await EmailScreen.enterEmail(email);

        // Home screen for 3 seconds, then back to the app
        await driver.background(3);

        expect(await driver.queryAppState(appId())).toBe(AppState.RUNNING_IN_FOREGROUND);
        await expect(EmailScreen.emailField).toHaveText(email);
    });
});
