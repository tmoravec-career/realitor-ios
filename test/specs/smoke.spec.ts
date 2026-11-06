import {AppState, appId} from '../support/app.ts';

describe('App under test', () => {
    it('launches in the foreground', async () => {
        await driver.activateApp(appId());
        expect(await driver.queryAppState(appId())).toBe(AppState.RUNNING_IN_FOREGROUND);
    });
});
