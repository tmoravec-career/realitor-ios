import LandingScreen from '../../screens/perchwell/LandingScreen.ts';
import EmailScreen from '../../screens/perchwell/EmailScreen.ts';
import DemoFormScreen from '../../screens/perchwell/DemoFormScreen.ts';
import {AppState, appId, restartApp} from '../../support/app.ts';

const SAFARI = 'com.apple.mobilesafari';

// The "Perchwell.com" link in the disclaimer leaves the app for Safari.
// Lifecycle check: Perchwell goes to the background and comes back where it was.
describe('Perchwell book a demo link', () => {
    beforeEach(async () => {
        await restartApp();
        await LandingScreen.waitForScreen();
    });

    afterEach(async () => {
        // Don't leave Safari in front of the next test
        await driver.terminateApp(SAFARI);
    });

    it('opens Perchwell.com in Safari and returns to the email screen', async () => {
        await LandingScreen.signIn();
        await EmailScreen.waitForScreen();

        await EmailScreen.bookDemoLink.click();
        await EmailScreen.openInSafariButton.click();

        // Both apps can report foreground for a moment mid-switch, so wait for both states
        await browser.waitUntil(
            async () =>
                (await driver.queryAppState(SAFARI)) === AppState.RUNNING_IN_FOREGROUND &&
                (await driver.queryAppState(appId())) < AppState.RUNNING_IN_FOREGROUND,
            {timeout: 15000, timeoutMsg: 'Safari did not replace Perchwell in the foreground'},
        );

        await driver.activateApp(appId());

        await expect(EmailScreen.emailField).toBeDisplayed();
    });

    // Fills the real perchwell.com form but never taps Submit: no demo request is sent
    it('fills in the book a demo form in Safari without submitting it', async () => {
        const demo = {
            firstName: 'Qa',
            lastName: 'Automation',
            email: 'qa.demo@example.com',
            organizationType: 'Brokerage',
            organizationName: 'QA Test Realty',
        };
        await LandingScreen.signIn();
        await EmailScreen.waitForScreen();
        await EmailScreen.bookDemoLink.click();
        await EmailScreen.openInSafariButton.click();
        await DemoFormScreen.waitForScreen();

        await expect(DemoFormScreen.heading).toBeDisplayed();

        // Dropdown first: once a text field has focus Safari zooms in and the
        // next tap only dismisses the keyboard instead of opening the menu
        await DemoFormScreen.chooseOrganizationType(demo.organizationType);
        await DemoFormScreen.firstNameField.setValue(demo.firstName);
        await DemoFormScreen.lastNameField.setValue(demo.lastName);
        await DemoFormScreen.emailField.setValue(demo.email);
        await DemoFormScreen.organizationNameField.setValue(demo.organizationName);

        await expect(DemoFormScreen.organizationTypeDropdown).toHaveAttribute('value', demo.organizationType);
        await expect(DemoFormScreen.firstNameField).toHaveAttribute('value', demo.firstName);
        await expect(DemoFormScreen.lastNameField).toHaveAttribute('value', demo.lastName);
        await expect(DemoFormScreen.emailField).toHaveAttribute('value', demo.email);
        await expect(DemoFormScreen.organizationNameField).toHaveAttribute('value', demo.organizationName);
        await expect(DemoFormScreen.submitButton).toExist();
    });
});
