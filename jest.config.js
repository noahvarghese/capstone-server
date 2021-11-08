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
    collectCoverageFrom: [
        "**/*.ts",
    ],
    coverageDirectory: "./__test__/coverage",
    coveragePathIgnorePatterns: ["node_modules", "database", "bin", "test.ts", "__test__", "src/util/logs", "src/index.ts"],
    coverageReporters: [
        "json-summary",
        "text",
        "lcov",
        "clover"
    ],
    detectOpenHandles: true,
    errorOnDeprecated: true,
    forceExit: true,
    maxConcurrency: 1,
    maxWorkers: 1,
    moduleDirectories: ["node_modules", "./"],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
    setupFilesAfterEnv: ["./jest.setup.js"],
    reporters: [
        "default",
        ["./node_modules/jest-html-reporter", {
            "dateFormat": "yyyy-mm-dd HH:MM:ss",
            "includeConsoleLog": true,
            "includeFailureMsg": true,
            "includeSuiteFailure": true,
            "outputPath": "./__test__/test-report.html",
            "pageTitle": "Test Report",
        }]
    ],
    roots: ["src", "__test__"],
    testEnvironment: 'node',
    testRegex: '/src/.*\\.(test|spec)?\\.(ts|tsx)$',
    transform: {
        '^.+\\.ts?$': 'ts-jest'
    },
    verbose: false
};