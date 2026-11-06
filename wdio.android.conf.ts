import type {Capabilities, Options} from '@wdio/types';
import {sharedConfig} from './wdio.shared.conf.ts';

export const config: Options.Testrunner & Capabilities.WithRequestedTestrunnerCapabilities = {
    ...sharedConfig,
    // The Android app's flow differs from iOS (no landing screen, inline errors),
    // so it runs the platform-neutral smoke spec plus its own android/ specs
    specs: [
        './test/specs/smoke.spec.ts',
        './test/specs/**/android/**/*.spec.ts',
    ],
    capabilities: [{
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        // Real phone serial from `adb devices`. Unset: Appium uses the only connected device
        ...(process.env.ANDROID_UDID ? {'appium:udid': process.env.ANDROID_UDID} : {}),
        // Confirmed on Google Play: play.google.com/store/apps/details?id=com.perchwell.re
        'appium:appPackage': 'com.perchwell.re',
        // Play Store build: no binary to reinstall, so never clear app data
        'appium:noReset': true,
        // Production app: let tests answer permission prompts explicitly
        'appium:autoGrantPermissions': false,
        'appium:newCommandTimeout': 180,
        'appium:uiautomator2ServerLaunchTimeout': 60000,
    },],
}
