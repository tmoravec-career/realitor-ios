# Perchwell real-device tests (iOS and Android)

Appium + WebdriverIO + TypeScript tests for the **Perchwell app** (`com.perchwell.re`). They run on **physical phones**, an iPhone and an Android phone, against the production App Store and Play Store builds, while logged out.

The suite covers what a logged-out user can reach:
- the sign-in email screen
- client-side email validation
- background and resume
- the "book a demo" link out to the phone's browser, and the demo form on perchwell.com (filled in, never submitted)

**No test calls Perchwell's backend.** The tests only submit emails the app rejects on its own (an empty field and `not-an-email`). They never tap Submit on the demo form.

## How it works

- **One repo, two platforms.** Each platform has its own config file. Specs, timeouts, the reporter and the Appium service are in `wdio.shared.conf.ts`.
- **Page objects.** Each screen is a class in `test/screens/`. Specs only call its getters and methods, so locators live in one place.
- **iOS and Android have their own screens and specs.** The Android app's flow differs from iOS:
  - no landing screen and no close button
  - errors appear inline under the field instead of a pop-up
  - different wording
  - no test IDs

  Android files live in `android/` folders. `wdio.ios.conf.ts` excludes `**/android/**`. `wdio.android.conf.ts` runs those folders plus the shared `smoke.spec.ts`.
- **Appium is started for you.** The WebdriverIO Appium service starts the project's local Appium before the run and stops it after. Don't start one yourself. The tests can't run without Appium, so if it doesn't start (it isn't installed, or port 4723 is taken) the run stops straight away with an error, before any spec runs. It doesn't wait out the 10-minute connection timeout. See [Troubleshooting](#troubleshooting).
- **The app is attached, not installed.** It's a store build, so there's no `.ipa` or `.apk`. Appium opens the app that's already on the phone by `bundleId` (iOS) or `appPackage` (Android). See [Production app limits](#production-app-limits).

## Requirements

| What | Version used | Notes |
|---|---|---|
| macOS | Sequoia 15.7 | |
| Node.js | 22+ (tested on 26) | |
| Xcode | 26.3 | iOS only. Builds and signs WebDriverAgent |
| Apple Development certificate | free or paid team | iOS only. Signs WebDriverAgent for your phone |
| iPhone | iOS 26+ | Perchwell installed from the App Store |
| Android Studio | any recent | Android only. Provides the SDK, `adb` and Java (its bundled JBR) |
| Android phone | tested on Moto X4, Android 9 | Perchwell installed from the Play Store |

Appium 3 and both drivers (XCUITest, UiAutomator2) are installed **locally** by `npm install`, so you don't need a global Appium.

For Android, set `ANDROID_HOME` (e.g. `~/Library/Android/sdk`) and `JAVA_HOME`, and put `platform-tools` on your `PATH`. `npx appium driver doctor uiautomator2` checks all of this. Its warnings about bundletool, ffmpeg and gstreamer are optional; ignore them.

## Setup

### 1. Install dependencies

```sh
npm install
npx appium driver list --installed   # should list xcuitest and uiautomator2
```

### 2a. Prepare the iPhone (one time)

1. Connect it by USB and tap **Trust This Computer**.
2. **Settings → Privacy & Security → Developer Mode** → on. The phone restarts.
3. **Settings → Developer → Enable UI Automation** → on.
4. **Settings → Display & Brightness → Auto-Lock → Never** while testing. WebDriverAgent can't start on a locked phone.
5. Install **Perchwell** from the App Store.

### 2b. Prepare the Android phone (one time)

1. **Settings → About phone → Build number**: tap it 7 times to turn on Developer options.
2. **Settings → System → Developer options → USB debugging** → on.
3. Connect it **with a data cable, straight into the Mac** (not through a hub). If the phone asks, set the USB mode to **File transfer**.
4. Accept **Allow USB debugging?** and tick **Always allow from this computer**.
5. Install **Perchwell** from the Play Store.
6. Check: `adb devices` lists the phone as `device`, and `adb shell pm list packages | grep perchwell` prints `package:com.perchwell.re`.

### 3. Create `.env`

```sh
cp .env.example .env
```

| Variable | Where to find it |
|---|---|
| `IOS_UDID` | `xcrun xctrace list devices` → the ID next to your iPhone |
| `IOS_TEAM_ID` | Your Apple team ID: Xcode → Settings → Accounts, or the **OU** field of your certificate: `security find-certificate -c "Apple Development" -p \| openssl x509 -noout -subject` |
| `WDA_BUNDLE_ID` | Any bundle ID unique to your team, e.g. `dev.<teamid>.WebDriverAgentRunner` |
| `ANDROID_UDID` | Optional. `adb devices` → the serial. Leave it empty when only one Android device is connected |

> The ID in parentheses in the certificate name (`Apple Development: you@example.com (XXXXXXXXXX)`) is **not** the team ID. Use the OU.

`.env` is in `.gitignore`. Never commit it.

### 4. First run

```sh
npm run typecheck
npm run test:ios -- --spec test/specs/smoke.spec.ts
npm run test:android -- --spec test/specs/smoke.spec.ts
```

**iOS:** the first run builds and signs **WebDriverAgent** (WDA), the test runner Appium installs on the phone, and takes a few minutes. Once it's installed, trust it once: **Settings → General → VPN & Device Management → your developer certificate → Trust**. Later runs start in about 20 seconds.

**Android:** the first run installs the UiAutomator2 server apps on the phone, which takes under a minute. The whole Android suite takes about 1.5 minutes.

## Running tests

All commands run from the project root. Arguments after `--` go to WebdriverIO.

```sh
# Whole suite
npm run test:ios
npm run test:android

# One spec file
npm run test:ios -- --spec test/specs/perchwell/login.spec.ts
npm run test:android -- --spec test/specs/perchwell/android/login.spec.ts

# One test (scenario): matches the it() title, or part of it
npm run test:android -- --spec test/specs/perchwell/android/login.spec.ts --mochaOpts.grep "badly formatted"

# More logging (every command and its result goes to logs/)
npm run test:android -- --logLevel info

# Type check only
npm run typecheck
```

Results print in the terminal (`spec` reporter). Appium and per-spec logs go to `logs/`, and each run overwrites them.

### Every spec and test

`--mochaOpts.grep` matches part of the full test title, so the short phrases below are enough. `--spec` keeps a phrase from matching a test in another spec.

**iOS**

```sh
# smoke.spec.ts
npm run test:ios -- --spec test/specs/smoke.spec.ts
npm run test:ios -- --spec test/specs/smoke.spec.ts --mochaOpts.grep "launches in the foreground"

# login.spec.ts
npm run test:ios -- --spec test/specs/perchwell/login.spec.ts
npm run test:ios -- --spec test/specs/perchwell/login.spec.ts --mochaOpts.grep "closes back to the landing screen"
npm run test:ios -- --spec test/specs/perchwell/login.spec.ts --mochaOpts.grep "for an empty email"
npm run test:ios -- --spec test/specs/perchwell/login.spec.ts --mochaOpts.grep "badly formatted email"
npm run test:ios -- --spec test/specs/perchwell/login.spec.ts --mochaOpts.grep "background and back"

# book-a-demo.spec.ts
npm run test:ios -- --spec test/specs/perchwell/book-a-demo.spec.ts
npm run test:ios -- --spec test/specs/perchwell/book-a-demo.spec.ts --mochaOpts.grep "returns to the email screen"
npm run test:ios -- --spec test/specs/perchwell/book-a-demo.spec.ts --mochaOpts.grep "without submitting it"
```

**Android**

```sh
# smoke.spec.ts
npm run test:android -- --spec test/specs/smoke.spec.ts
npm run test:android -- --spec test/specs/smoke.spec.ts --mochaOpts.grep "launches in the foreground"

# android/login.spec.ts
npm run test:android -- --spec test/specs/perchwell/android/login.spec.ts
npm run test:android -- --spec test/specs/perchwell/android/login.spec.ts --mochaOpts.grep "opens on the email screen"
npm run test:android -- --spec test/specs/perchwell/android/login.spec.ts --mochaOpts.grep "field is empty"
npm run test:android -- --spec test/specs/perchwell/android/login.spec.ts --mochaOpts.grep "badly formatted email"
npm run test:android -- --spec test/specs/perchwell/android/login.spec.ts --mochaOpts.grep "background and back"

# android/book-a-demo.spec.ts
npm run test:android -- --spec test/specs/perchwell/android/book-a-demo.spec.ts
npm run test:android -- --spec test/specs/perchwell/android/book-a-demo.spec.ts --mochaOpts.grep "returns to the email screen"
npm run test:android -- --spec test/specs/perchwell/android/book-a-demo.spec.ts --mochaOpts.grep "without submitting it"
```

## Reports

Every run writes two kinds of output to `reports/`, which is in `.gitignore`:

| What | Where | Kept |
|---|---|---|
| Allure results (raw data for the HTML report) | `reports/allure-results/` | Replaced each run; the trend history is carried over |
| Allure HTML report | `reports/allure-report/` | Until you generate the next one |
| Screenshot + page source of every failed test | `reports/failures/<run time>/<spec>--<test>.png` and `.xml` | Every run gets its own folder; delete old ones by hand |

```sh
npm run test:android      # or test:ios; writes reports/allure-results
npm run report            # builds the HTML report and opens it in the browser
npm run report:generate   # build only (reports/allure-report/index.html)
npm run report:open       # open the last built report
```

- **Open the report through `npm run report:open`**, not by double-clicking `index.html`. The report loads its data with requests that browsers block from `file://`.
- **Each failed test** in the report has its **Screenshot** and **Page source** attached. The page source is the element tree as the phone saw it at the moment of failure. Search it to check whether a locator was wrong or the screen was different.
- **The Trend chart** fills in from the second run on. Each run copies the last report's history into the new results.
- **Reports cover one platform at a time.** Each run replaces the results, so run `report` after each platform's run.
- **Appium commands aren't listed as steps** (`disableWebdriverStepsReporting`). Every tap and lookup as its own step would bury the result.
- The Allure tool is a Java app installed by `npm install` (`allure-commandline`). It uses the same `JAVA_HOME` as Android.

## Project structure

```
wdio.shared.conf.ts       Shared by both platforms: specs, Mocha, reporters, Appium service, timeouts, failure hook
reports/                  Allure results and report, failure screenshots (created by a run, not committed)
wdio.ios.conf.ts          iPhone capabilities (XCUITest, signing, bundle ID); excludes android/ specs
wdio.android.conf.ts      Android capabilities (UiAutomator2, package); runs smoke + android/ specs
test/
  support/app.ts          App states, appId(), restartApp(): shared by both platforms
  screens/perchwell/      iOS page objects
    LandingScreen.ts      Sign in button
    EmailScreen.ts        Email field, Continue, close, disclaimer, Perchwell.com link, error pop-up
    DemoFormScreen.ts     "Book a live demo" form in Safari
    EmailScreen.onlyAI.ts Unreviewed first draft of EmailScreen, kept to show what review changed. Not used by any test
    android/
      EmailScreen.ts      Android email screen (Compose: text and class locators, inline errors)
      DemoFormScreen.ts   "Book a live demo" form in Chrome (web ids as resource IDs, cookie banner)
  specs/
    smoke.spec.ts         App launches in the foreground (both platforms)
    perchwell/
      login.spec.ts       iOS: navigation, empty email, badly formatted email, background/resume
      book-a-demo.spec.ts iOS: link opens Safari and the app resumes; fills the demo form, never submits
      android/
        login.spec.ts       Android: email screen, empty email, badly formatted email, background/resume
        book-a-demo.spec.ts Android: link opens Chrome and the app resumes; fills the demo form, never submits
```

## Production app limits

Perchwell comes from the App Store and Play Store, so Appium has no binary to install. Both configs set **`noReset: true`**, which shapes most of the suite:

| Can't do | Why | What the suite does instead |
|---|---|---|
| Reset the app between tests (`fullReset`, `noReset: false`) | A reset uninstalls or clears the app, and Appium can't reinstall a store build | `restartApp()` before each test (see Hooks) |
| Start from a fresh install or first launch | No binary to reinstall | Start from the logged-out screen already on the phone |
| Use `appium:app` | No `.ipa` / `.apk` to point at | Attach by `bundleId` / `appPackage` |
| Log in, or go past the email step | No test account; a real email would reach Perchwell's backend | Logged-out screens and client-side validation only |
| Mock the network | No debug build | Only flows that never call the backend |
| Use test IDs on Android | The release Compose build has no test tags | Text and class locators |
| Grant permissions automatically | `autoGrantPermissions: false` on purpose: don't change a production app's permissions behind the user's back | Tests answer prompts themselves (none reached yet) |
| Run on a simulator or emulator | App Store builds don't run on the iOS simulator; the Android emulator image here (`google_apis`) has no Play Store | Real phones |

Because `noReset` keeps state, anything a test leaves behind carries over: the browser in front, a typed email, a cookie choice. Each spec restarts the app first and closes the browser after.

## Hooks

Hooks are code that runs around the tests, not inside them.

### Mocha hooks (in the spec files)

| Hook | Where | What it does | Why |
|---|---|---|---|
| `beforeEach` | every spec except smoke | `restartApp()`: `terminateApp` + `activateApp` for Perchwell, then waits for the first screen (landing on iOS, email on Android) | With `noReset` the app may reopen wherever the last test left it. A restart gives every test the same starting screen, so test order doesn't matter |
| `afterEach` | `book-a-demo.spec.ts` (both) | `terminateApp` for Safari (`com.apple.mobilesafari`) or Chrome (`com.android.chrome`) | The link opens the browser. Closing it keeps the browser from sitting in front of the next test |

### WebdriverIO config hooks (in `wdio.shared.conf.ts`)

| Hook | What it does | Why |
|---|---|---|
| `onPrepare` | Runs once before any test. Sets `RUN_ID` (the run's start time), clears `reports/allure-results`, and copies the last report's `history` into it | One failures folder per run; fresh results without losing the trend |
| `afterTest` | When a test fails: saves a screenshot and the page source to `reports/failures/<RUN_ID>/` and attaches both to the Allure report. Errors here are logged, never thrown | A one-off failure leaves evidence. If the session is already dead, the hook mustn't turn one failure into two |

The **Appium service** (`services: ['appium']`) starts a local Appium server before the run and stops it afterwards.

### Configuration choices

- **`noReset: true`** (both). See [Production app limits](#production-app-limits).
- **`allowProvisioningDeviceRegistration: true`** (iOS). Lets `xcodebuild` create the provisioning profile for WebDriverAgent. Without it the WDA build fails with `xcodebuild failed with code 65`.
- **WDA timeouts of 4 minutes, `connectionRetryTimeout` of 10 minutes** (iOS). The first WDA build is slow.
- **`uiautomator2ServerLaunchTimeout: 60000`** (Android). Gives the UiAutomator2 server time to start on an older phone.
- **`ANDROID_UDID` optional** (Android). Without it Appium uses the only connected device.
- **`maxInstances: 1`.** One phone per platform, so specs run one after another.

## Locators

### iOS: accessibility IDs first

Perchwell's iOS app is native UIKit, and its iOS team sets `accessibilityIdentifier`s following a `UITests.*` convention for their own UI tests, so the IDs are stable.

| Element | Locator |
|---|---|
| Sign in (landing) | `~UITests.buttons.landing.signin` |
| Email field | `~UITests.textfields.auth.email` |
| Continue | `~UITests.buttons.next` |
| Close | `~UITests.buttons.close` |
| Disclaimer | `~<full disclaimer text>`: its ID is the whole sentence, so the locator also verifies the text |
| Error pop-up | `name == "UITests.snackViews.error" AND type == "XCUIElementTypeOther"` |

Where an ID matches more than one element, an `-ios predicate string` also filters on type. WebdriverIO 10 rejects a locator that matches two elements.
- **The "Perchwell" header.** `~Perchwell` matches the app, the navigation bar *and* the header.
- **The error pop-up.** Its container and its icon share the same ID.

### Android: visible text and class

The Android app is **Jetpack Compose with no test tags**, so its elements have no resource IDs. Locators match on visible text or class with `android=new UiSelector()…`. If Perchwell changes the wording, these break.

| Element | Locator |
|---|---|
| Header (logo) | `~Perchwell` (its content-desc) |
| Subtitle | `text("Sign in to unlock all features")`: no "the", unlike iOS |
| Email field | `className("android.widget.EditText")`: the only text field |
| Disclaimer | `text(...)` with the full text. Android has a space **and a line break** after "clients." (`clients. \nIf you…`), and `text()` must match exactly |
| Continue | `text("Continue")`: the text sits inside the clickable container |
| Empty email error | `text("Please enter an email address")` |
| Badly formatted email error | `text("Please enter your email in format: user@emailclient.com")` |

The errors appear inline under the field and stay until the next submit.

## Web views: the demo form

The **Perchwell.com** link in the disclaimer opens the phone's browser. Both platforms test the web page through the **native accessibility tree** (XCUITest for Safari, UiAutomator2 for Chrome), the same way they test the app. They never switch to a web context, so:
- no chromedriver or Safari Web Inspector is involved
- no driver version has to match the browser's
- one session drives both the app and the browser

Both `book-a-demo` specs follow the same steps:
1. Tap Perchwell.com.
2. Wait until the browser is in the foreground **and** Perchwell isn't. Both can report foreground for a moment mid-switch.
3. Then one of two tests:
   - **Link test:** bring Perchwell back with `activateApp` and check the email field.
   - **Form test:** pick the organization type, fill the four text fields, check every value and check that Submit exists. **Never tap Submit**: it's Perchwell's real sales form.

| | iOS (Safari) | Android (Chrome) |
|---|---|---|
| Tapping the link | A link preview menu opens; the test taps **Open** (`~Open`) | Full Chrome opens straight away (not a Custom Tab) |
| The link itself | Its own element, `~Perchwell.com` | Not an element, just a styled span inside the disclaimer text. `tapBookDemoLink()` taps 70% across, in the middle of the last of 4 lines, measured on the Moto X4 (1080×1920). Another screen size or font scale may need new numbers |
| Coming back | `activateApp` | `activateApp`. Back stays inside Chrome |
| Field locators | Class chain inside the form, by placeholder | The page's HTML ids, which Chrome exposes as resource IDs: `name`, `Last-Name`, `email`, `Organization-Type`, `Organization-Name` |
| Organization type | Safari's menu. Pick it **before** typing, or Safari zooms in and the next tap only closes the keyboard | Chrome's native list of `CheckedTextView` options |
| Reaching the form | Safari sometimes stops short of the `#demo-form` anchor, so the test scrolls the field into view | The page opens on the form |
| Submit | `~Submit`, checked with `toExist` | Chrome only lists web elements that are on screen. `scrollToSubmit()` swipes first, starting above the fields so the swipe can never press Submit |
| Cookie banner | Not shown | A HubSpot banner covers the form, about 5 s after the form appears. `declineCookies()` waits up to 10 s and taps **Decline** |

**Android web ids:** look them up with `UiSelector().resourceId("name")`. Appium's `id` strategy adds `com.perchwell.re:id/` in front, so `$('id=name')` finds nothing.

**Cookie banner:** Chrome remembers the choice in the `__hs_cookie_cat_pref` cookie, so most runs never see the banner and just wait out the 10 s. To test the banner path again, delete only the perchwell.com cookies through Chrome's DevTools socket:
1. Open Chrome on the phone.
2. Run `adb forward tcp:9222 localabstract:chrome_devtools_remote`.
3. Use the DevTools protocol (`Storage.getCookies`, then `Storage.setCookies` with an expired date for each perchwell.com cookie).
4. Press Home so Chrome saves the change. A force-stop throws it away.

`Storage.clearDataForOrigin` returns an internal error on Chrome for Android.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| The run stops at once with *Appium exited before timeout*, before any spec | Appium couldn't start. Usually port 4723 is taken by another Appium (often the one for **Appium Inspector**) | Stop the other Appium (`lsof -i :4723` shows it) and run again |
| The run stops at once with *Appium is not installed locally* | `npm install` hasn't been run | Run `npm install` |
| `xcodebuild failed with code 65`, *No profiles for '…WebDriverAgentRunner.xctrunner'* | No provisioning profile for WDA | Make sure `allowProvisioningDeviceRegistration` is set and `IOS_TEAM_ID` is the OU of your certificate |
| `code 65`, *Developer App Certificate is not trusted* | WDA was reinstalled and the trust reset | Trust the certificate again on the phone. Avoid reinstalling WDA |
| Any `code 65` | Appium only shows the code | Read the real error: `xcrun xcresulttool get build-results --path <newest ~/Library/Developer/Xcode/DerivedData/WebDriverAgent-*/Logs/Test/*.xcresult>` |
| WDA installs but never answers; the log shows `classALocked == 1`, or *Not authorized for performing UI testing actions* | The phone is locked, or a stale `xcodebuild` is holding a stuck WDA | Unlock; Auto-Lock to Never; check Enable UI Automation; `ps aux \| grep xcodebuild` and kill the stale one |
| `The port #8100 is occupied by an other process` | Another Appium session (often **Appium Inspector**) is holding WDA | End the Inspector session or stop that Appium server |
| `strict mode violation: … resolved to 2 elements` | The locator matches more than one element | Narrow it (by type, or with a predicate) |
| `adb devices` is empty and the phone isn't in `system_profiler SPUSBDataType` | Charge-only cable, a hub that drops data, or USB mode set to Charging | Data cable straight into the Mac; set the phone's USB mode to File transfer |
| Android element "not displayed" with an exact `text()` match | Hidden whitespace or a line break in the app's text | Dump the page source and copy the text exactly (see Appium Inspector) |
| Android Inspector session drops when tests start | Only one UiAutomator2 server can run on the phone | End the Inspector session before `npm run test:android` |
| `Cannot launch <bundle id>` | The app isn't installed or crashes on launch | Check the bundle ID / package; check crash logs in `~/Library/Logs/DiagnosticReports` (iOS) or `adb logcat` (Android) |

## Appium Inspector

Use your own Appium (`npx appium`) on port 4723, with the capabilities for your phone. End the Inspector session before running the suite.

**iOS** (fill in your values):

```json
{
  "platformName": "iOS",
  "appium:automationName": "XCUITest",
  "appium:udid": "<IOS_UDID>",
  "appium:bundleId": "com.perchwell.re",
  "appium:noReset": true,
  "appium:xcodeOrgId": "<IOS_TEAM_ID>",
  "appium:xcodeSigningId": "Apple Development",
  "appium:updatedWDABundleId": "<WDA_BUNDLE_ID>",
  "appium:allowProvisioningDeviceRegistration": true,
  "appium:newCommandTimeout": 3600
}
```

**Android:**

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:udid": "<ANDROID_UDID>",
  "appium:appPackage": "com.perchwell.re",
  "appium:noReset": true,
  "appium:autoGrantPermissions": false,
  "appium:uiautomator2ServerLaunchTimeout": 60000,
  "appium:newCommandTimeout": 3600
}
```

Keep `noReset: true` in both, or Appium may clear Perchwell's data.

## Status

| Spec | iOS (iPhone) | Android (Moto X4, Android 9) |
|---|---|---|
| `smoke.spec.ts` | ✅ passing | ✅ passing |
| `login.spec.ts`: email screen / navigation | ✅ passing | ✅ passing |
| `login.spec.ts`: empty and badly formatted email | ✅ passing | ✅ passing |
| `login.spec.ts`: background/resume | ✅ passing | ✅ passing |
| `book-a-demo.spec.ts`: link opens the browser, app resumes | ⚠️ fix in place (tap **Open** in the link menu); not re-run since | ✅ passing |
| `book-a-demo.spec.ts`: demo form filled, never submitted | ⚠️ not re-run since | ✅ passing |

**Known issues**
- **Android demo-form test, one unexplained failure.** It failed once in a full-suite run and passed in three reruns. That was before failure screenshots existed; if it happens again, check `reports/failures/`.
- **Android link tap depends on layout.** It uses a measured position, so it can miss on another screen size or font scale.
