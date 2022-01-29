// This is for vs-code plugin 'JEST TEST EXPLORER'
// https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer
// The plugin utilizes default jest location and config name
// Looks for a jest.config.(ts|js) by default
import jestConfigBase from "jest.config.base";
export default {
    ...jestConfigBase,
    // integration tests require different startup files so they need to be run seperately
    // And we will keep database tests out because the models are not to change frequently
    testPathIgnorePatterns: ["integration.test.ts", "db.test.ts"],
};