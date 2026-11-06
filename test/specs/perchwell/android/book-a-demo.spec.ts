import EmailScreen from '../../../screens/perchwell/android/EmailScreen.ts';
import DemoFormScreen from '../../../screens/perchwell/android/DemoFormScreen.ts';
import {AppState, appId, restartApp} from '../../../support/app.ts';

const CHROME = 'com.android.chrome';

// The "Perchwell.com" link in the disclaimer leaves the app for Chrome (full Chrome,
// not a Custom Tab). Lifecycle check: Perchwell goes to the background and comes back.
describe('Perchwell book a demo link (Android)', () => {
    beforeEach(async () => {
        await restartApp();
        await EmailScreen.waitForScreen();
    });

    afterEach(async () => {
        // Don't leave Chrome in front of the next test
        await driver.terminateApp(CHROME);
    });

    it('opens Perchwell.com in Chrome and returns to the email screen', async () => {
        await EmailScreen.tapBookDemoLink();

        // Both apps can report foreground for a moment mid-switch, so wait for both states
        await browser.waitUntil(
            async () =>
                (await driver.queryAppState(CHROME)) === AppState.RUNNING_IN_FOREGROUND &&
                (await driver.queryAppState(appId())) < AppState.RUNNING_IN_FOREGROUND,
            {timeout: 15000, timeoutMsg: 'Chrome did not replace Perchwell in the foreground'},
        );

        // Back stays in Chrome, so bring Perchwell forward directly
        await driver.activateApp(appId());

        await expect(EmailScreen.emailField).toBeDisplayed();
    });

    // Fills the real perchwell.com form but never taps Submit: no demo request is sent
    it('fills in the book a demo form in Chrome without submitting it', async () => {
        const demo = {
            firstName: 'Qa',
            lastName: 'Automation',
            email: 'qa.demo@example.com',
            organizationType: 'Brokerage',
            organizationName: 'QA Test Realty',
        };
        await EmailScreen.tapBookDemoLink();
        await DemoFormScreen.waitForScreen();

        await expect(DemoFormScreen.heading).toBeDisplayed();

        await DemoFormScreen.chooseOrganizationType(demo.organizationType);
        await DemoFormScreen.firstNameField.setValue(demo.firstName);
        await DemoFormScreen.lastNameField.setValue(demo.lastName);
        await DemoFormScreen.emailField.setValue(demo.email);
        await DemoFormScreen.organizationNameField.setValue(demo.organizationName);
        await driver.hideKeyboard();

        await expect(DemoFormScreen.organizationTypeDropdown).toHaveText(demo.organizationType);
        await expect(DemoFormScreen.firstNameField).toHaveText(demo.firstName);
        await expect(DemoFormScreen.lastNameField).toHaveText(demo.lastName);
        await expect(DemoFormScreen.emailField).toHaveText(demo.email);
        await expect(DemoFormScreen.organizationNameField).toHaveText(demo.organizationName);

        await DemoFormScreen.scrollToSubmit();
        await expect(DemoFormScreen.submitButton).toExist();
    });
});
