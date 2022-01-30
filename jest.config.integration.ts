import jestConfigBase from "jest.config.base";

export default {
    ...jestConfigBase,
    // Have to turn this off
    // because anything that is closed in the globalTeardown is not recognized as closed
    // so this throws an error if true
    detectOpenHandles: false,
    globalSetup: "./jest.integration.setup.ts",
    globalTeardown: "./jest.integration.teardown.ts",
    reporters: [
        "default",
        [
            "./node_modules/jest-html-reporter",
            {
                dateFormat: "yyyy-mm-dd HH:MM:ss",
                includeConsoleLog: true,
                includeFailureMsg: true,
                includeSuiteFailure: true,
                outputPath: "./__test__/integration-test-report.html",
                pageTitle: "Integration Test Report",
            },
        ],
    ],
    testRegex: "/src/.*\\.integration\\.(test|spec)?\\.(ts|tsx)$",
};
