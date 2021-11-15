import Logs from "@util/logs/logs";
import { pathsToModuleNameMapper } from "ts-jest/utils";
import { compilerOptions } from "./tsconfig.json";

Logs.Event("Jest config loaded");

export default {
    bail: true,
    collectCoverage: true,
    coverageDirectory: "./__test__/coverage",
    collectCoverageFrom: ["src/**/*.ts"],
    coveragePathIgnorePatterns: [
        "node_modules",
        "src/index.ts",
        "src/util/logs",
        "src/services",
    ],
    coverageReporters: ["json-summary", "text", "lcov", "clover"],
    detectOpenHandles: true,
    errorOnDeprecated: true,
    forceExit: true,
    maxConcurrency: 1,
    maxWorkers: 1,
    moduleDirectories: ["node_modules", "./"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
    setupFiles: ["dotenv/config"],
    setupFilesAfterEnv: ["./jest.setup.ts"],
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
    roots: ["src", "__test__"],
    testEnvironment: "node",
    testRegex: "/src/.*\\.(test|spec)?\\.(ts|tsx)$",
    transform: {
        "^.+\\.ts?$": "ts-jest",
    },
    verbose: false,
};
