// "Book a live demo" form on perchwell.com, in Chrome. Opened from the email screen's
// Perchwell.com link. This is the real production form: never tap Submit.
//
// Chrome exposes the page's HTML ids as resource-ids with no package prefix, so match
// them with resourceId(). The `id` strategy would add "com.perchwell.re:id/" and miss.
const byWebId = (id: string) => $(`android=new UiSelector().resourceId("${id}")`);

class DemoFormScreen {
    get heading() {
        return $('android=new UiSelector().text("Book a live demo with our team")');
    }

    get firstNameField() {
        return byWebId('name');
    }

    get lastNameField() {
        return byWebId('Last-Name');
    }

    get emailField() {
        return byWebId('email');
    }

    // A <select>. Its text is the chosen option
    get organizationTypeDropdown() {
        return byWebId('Organization-Type');
    }

    get organizationNameField() {
        return byWebId('Organization-Name');
    }

    // Only for checking it's there. Tapping it would send a real demo request
    get submitButton() {
        return $('android=new UiSelector().className("android.widget.Button").text("Submit")');
    }

    // HubSpot cookie banner over the form. Shown until a choice is stored in Chrome
    get declineCookiesButton() {
        return byWebId('hs-eu-decline-button');
    }

    // Options in Chrome's native <select> list: MLS, Brokerage, Broker Office, Vendor, Other, ...
    organizationTypeOption(name: string) {
        return $(`android=new UiSelector().className("android.widget.CheckedTextView").text("${name}")`);
    }

    async waitForScreen() {
        await this.firstNameField.waitForDisplayed({timeout: 20000});
        await this.declineCookies();
    }

    // HubSpot's script adds the banner after the form is up (more than 3 s later on the
    // Moto X4) and it covers the form. Decline rather than accept: the test shouldn't
    // consent to tracking. Chrome keeps the choice in a cookie, so later runs see no
    // banner and just wait out the timeout
    async declineCookies() {
        try {
            await this.declineCookiesButton.waitForDisplayed({timeout: 10000});
        } catch {
            return;
        }
        await this.declineCookiesButton.click();
        await this.declineCookiesButton.waitForDisplayed({reverse: true});
    }

    async chooseOrganizationType(name: string) {
        await this.organizationTypeDropdown.click();
        await this.organizationTypeOption(name).click();
    }

    // Chrome only lists web nodes that are on screen, and Submit sits below the fold.
    // Swipe from the heading area, above the fields, so the gesture never lands on Submit
    async scrollToSubmit() {
        for (let i = 0; i < 3 && !(await this.submitButton.isExisting()); i++) {
            await driver.execute('mobile: scrollGesture', {
                left: 100, top: 300, width: 880, height: 700,
                direction: 'down', percent: 0.8,
            });
        }
    }
}

export default new DemoFormScreen();
