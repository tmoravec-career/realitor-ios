import type {Options} from '@wdio/types';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import allureReporter from '@wdio/allure-reporter';

const REPORTS = path.resolve('reports');
const ALLURE_RESULTS = path.join(REPORTS, 'allure-results');
const ALLURE_REPORT = path.join(REPORTS, 'allure-report');

// Keeps a file name readable and safe: "fills in the form" -> "fills-in-the-form"
const slug = (text: string) => text.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80);

// Everything both platforms share. Each platform config adds its own capabilities.
export const sharedConfig: Omit<Options.Testrunner, 'capabilities'> = {
    runner: 'local',
    specs: [
        './test/specs/**/*.spec.ts'
    ],
    exclude: [
        // 'path/to/excluded/files'
    ],
    maxInstances: 1,
    logLevel: 'warn',
    outputDir: './logs',
    framework: 'mocha',
    reporters: [
        'spec',
        ['allure', {
            outputDir: ALLURE_RESULTS,
            // Every Appium command as a step drowns the report; tests read better without
            disableWebdriverStepsReporting: true,
            // Screenshots taken in afterTest are attached to the failing test
            disableWebdriverScreenshotsReporting: false,
        }],
    ],
    services: ['appium'],
    waitforTimeout: 15000,
    // First iOS run builds and signs WebDriverAgent, which can take minutes
    connectionRetryTimeout: 600000,
    connectionRetryCount: 1,
    mochaOpts: {
        ui: 'bdd',
        timeout: 120000,
    },

    // Runs once, in the launcher, before any worker starts
    onPrepare() {
        // One folder per run for failure files; workers inherit this env var
        process.env.RUN_ID ??= new Date().toISOString().replace(/[:.]/g, '-');

        // Fresh Allure results each run, but carry the last report's history over
        // so the report keeps its trend across runs
        fs.rmSync(ALLURE_RESULTS, {recursive: true, force: true});
        fs.mkdirSync(ALLURE_RESULTS, {recursive: true});
        const history = path.join(ALLURE_REPORT, 'history');
        if (fs.existsSync(history)) {
            fs.cpSync(history, path.join(ALLURE_RESULTS, 'history'), {recursive: true});
        }
    },

    // On failure: save a screenshot and the page source, on disk and in the Allure report.
    // The page source is the element tree, so a wrong locator can be checked afterwards
    async afterTest(test, _context, {passed}) {
        if (passed) return;
        const dir = path.join(REPORTS, 'failures', process.env.RUN_ID ?? 'local');
        const name = slug(`${path.basename(test.file ?? 'spec', '.spec.ts')}--${test.title}`);
        fs.mkdirSync(dir, {recursive: true});

        // The session may be gone (app crash, timeout): never fail the hook itself
        try {
            // Allure attaches screenshots taken through WebdriverIO automatically,
            // so this one call fills both the folder and the report
            await browser.saveScreenshot(path.join(dir, `${name}.png`));
        } catch (e) {
            console.warn(`Could not take a screenshot for "${test.title}": ${e}`);
        }
        try {
            const source = await browser.getPageSource();
            fs.writeFileSync(path.join(dir, `${name}.xml`), source);
            allureReporter.addAttachment('Page source', source, 'application/xml');
        } catch (e) {
            console.warn(`Could not read the page source for "${test.title}": ${e}`);
        }
    },
}
