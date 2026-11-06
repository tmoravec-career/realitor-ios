// "Book a live demo" form on perchwell.com, in Safari. Opened from the email screen's
// Perchwell.com link. This is the real production form: never tap Submit.

// The form's fields have no accessibility IDs, so find them inside the form by placeholder
const FORM = '**/XCUIElementTypeOther[`name == "Book a Demo, form"`]';
const field = (placeholder: string) =>
    $(`-ios class chain:${FORM}/XCUIElementTypeTextField[\`placeholderValue == "${placeholder}"\`]`);

class DemoFormScreen {
    // The section and its text share this ID, so narrow to the text by type
    get heading() {
        return $('-ios predicate string:name == "Book a live demo with our team" AND type == "XCUIElementTypeStaticText"');
    }

    get firstNameField() {
        return field('Name');
    }

    get lastNameField() {
        return field('Last Name');
    }

    get emailField() {
        return field('Email');
    }

    // A <select>. Its value is the chosen option, so find it by position, not text
    get organizationTypeDropdown() {
        return $(`-ios class chain:${FORM}/XCUIElementTypeButton[1]`);
    }

    get organizationNameField() {
        return field('Organization Name');
    }

    // Only for checking it's there. Tapping it would send a real demo request
    get submitButton() {
        return $('~Submit');
    }

    // Options in the dropdown's menu: MLS, Brokerage, Broker Office, Vendor, Other, ...
    organizationTypeOption(name: string) {
        return $(`~${name}`);
    }

    // The link opens perchwell.com/#demo-form, but Safari sometimes jumps to the anchor
    // before the page finishes laying out and stops short, leaving the form off screen
    async waitForScreen() {
        await this.firstNameField.waitForExist({timeout: 20000});
        if (!(await this.firstNameField.isDisplayed())) {
            await driver.execute('mobile: scroll', {elementId: await this.firstNameField.elementId, toVisible: true});
        }
        await this.firstNameField.waitForDisplayed();
    }

    async chooseOrganizationType(name: string) {
        await this.organizationTypeDropdown.click();
        await this.organizationTypeOption(name).click();
    }
}

export default new DemoFormScreen();
