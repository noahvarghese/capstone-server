import jestConfigBase from "jest.config.base";
export default {
    ...jestConfigBase,
    reporters: [
        "default",
        [
            "./node_modules/jest-html-reporter",
            {
                dateFormat: "yyyy-mm-dd HH:MM:ss",
                includeConsoleLog: true,
                includeFailureMsg: true,
                includeSuiteFailure: true,
                outputPath: "./__test__/unit-test-report.html",
                pageTitle: "Unit Test Report",
            },
        ],
    ],
    testRegex: "/src/.*\\.unit\\.(test|spec)?\\.(ts|tsx)$",
};
