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
    coveragePathIgnorePatterns: ["node_modules", "test"],
    coverageReporters: [
        "json-summary",
        "text",
        "lcov"
    ],
    errorOnDeprecated: true,
    maxConcurrency: 1,
    maxWorkers: 2,
    moduleDirectories: ["node_modules", "./"],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
    setupFilesAfterEnv: ["./jest.setup.js"],
    reporters: [
        "default",
        ["./node_modules/jest-html-reporter", {
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
    verbose: true
};