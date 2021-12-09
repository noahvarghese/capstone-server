import jestConfigBase from "jest.config.base";
export default {
    ...jestConfigBase,
    collectCoverage: true,
    coverageDirectory: "./__test__/coverage",
    collectCoverageFrom: ["src/**/*.ts"],
    coveragePathIgnorePatterns: [
        "node_modules",
        "src/index.ts",
        "src/util",
        "src/services/app",
        ".test.ts",
    ],
    coverageReporters: ["json-summary", "text", "lcov", "clover"],
    reporters: [
        "default",
        [
            "./node_modules/jest-html-reporter",
            {
                dateFormat: "yyyy-mm-dd HH:MM:ss",
                includeConsoleLog: true,
                includeFailureMsg: true,
                includeSuiteFailure: true,
                outputPath: "./__test__/test-report.html",
                pageTitle: "Test Report",
            },
        ],
    ],
    testRegex: "/src/.*\\.unit\\.(test|spec)?\\.(ts|tsx)$",
};
