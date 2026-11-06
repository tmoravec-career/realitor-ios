import type {Capabilities, Options} from '@wdio/types';
import {sharedConfig} from './wdio.shared.conf.ts';

export const config: Options.Testrunner & Capabilities.WithRequestedTestrunnerCapabilities = {
    ...sharedConfig,
    // android/ specs use Android screens
    exclude: ['./test/specs/**/android/**'],
    capabilities: [{
        platformName: 'iOS',
        'appium:automationName': 'XCUITest',
        // Real Phone Setup
        'appium:udid': process.env.IOS_UDID!,
        'appium:xcodeOrgId': process.env.IOS_TEAM_ID!,
        'appium:xcodeSigningId': 'Apple Development',
        'appium:bundleId': 'com.perchwell.re',
        // App Store build: no binary to reinstall, so never clear app data
        'appium:noReset': true,
        // WebDriverAgent Application identifier
        'appium:updatedWDABundleId': process.env.WDA_BUNDLE_ID!,
        // xcodebuild creates the provisioning profile for the WebDriverAgent
        'appium:allowProvisioningDeviceRegistration': true,
        'appium:wdaLaunchTimeout': 240000,
        'appium:wdaConnectionTimeout': 240000,
        'appium:newCommandTimeout': 180,
        // Logging
        'appium:showXcodeLog': true,
        'appium:showIOSLog': true,
    },],
}
