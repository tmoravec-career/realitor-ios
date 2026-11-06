// App states returned by driver.queryAppState
export const AppState = {
    NOT_RUNNING: 1,
    RUNNING_IN_BACKGROUND_SUSPENDED: 2,
    RUNNING_IN_BACKGROUND: 3,
    RUNNING_IN_FOREGROUND: 4,
} as const;

// Bundle ID (iOS) or package (Android) of the app this run targets
export function appId(): string {
    const caps = driver.requestedCapabilities as WebdriverIO.Capabilities;
    return (caps['appium:bundleId'] ?? caps['appium:appPackage'])!;
}

// noReset keeps app data, so a test can't trust where the app was left.
// Kill it and launch it fresh so every test starts from the first screen.
export async function restartApp() {
    await driver.terminateApp(appId());
    await driver.activateApp(appId());
}
