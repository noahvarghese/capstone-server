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
                outputPath: "./__test__/database-test-report.html",
                pageTitle: "Database Test Report",
            },
        ],
    ],
    testRegex: "/src/.*\\.db\\.(test|spec)?\\.(ts|tsx)$",
};
