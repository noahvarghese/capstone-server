/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const {
    pathsToModuleNameMapper
} = require("ts-jest/utils");

const {
    compilerOptions
} = require('./tsconfig');

module.exports = {
    bail: true,
    collectCoverage: true,
    coverageDirectory: "./__test__/coverage",
    coveragePathIgnorePatterns: ["node_modules", "test", "__test__", "database", "bin"],
    coverageReporters: [
        "json-summary",
        "text",
        "lcov",
        "clover"
    ],
    detectOpenHandles: true,
    errorOnDeprecated: true,
    forceExit: true,
    globalSetup: "<rootDir>/__test__/setup.ts",
    globalTeardown: "<rootDir>/__test__/teardown.ts",
    maxConcurrency: 1,
    maxWorkers: 1,
    moduleDirectories: ["node_modules", "./"],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
    setupFilesAfterEnv: ["./jest.setup.js"],
    reporters: [
        "default",
        ["./node_modules/jest-html-reporter", {
            "dateFormat": "yyyy-mm-dd",
            "includeConsoleLog": true,
            "includeFailureMsg": true,
            "includeSuiteFailure": true,
            "outputPath": "./__test__/test-report.html",
            "pageTitle": "Test Report",
        }]
    ],
    roots: ["./"],
    testEnvironment: 'node',
    testRegex: '/src/.*\\.(test|spec)?\\.(ts|tsx)$',
    transform: {
        '^.+\\.ts?$': 'ts-jest'
    },
    verbose: false
};