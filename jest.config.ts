import Logs from "@noahvarghese/logger";
import { pathsToModuleNameMapper } from "ts-jest/utils";
import { compilerOptions } from "./tsconfig.json";

let database = process.env.DB_NAME ?? "";

if (typeof process.env.DB_ENV !== "string") {
    process.env.DB_ENV = "_test";
}

if (process.env.DB_ENV.startsWith("_")) {
    database += process.env.DB_ENV;
} else {
    database += `_${process.env.DB_ENV}`;
}

if (process.argv.includes("--listTests") === false) {
    Logs.Log("Jest config loaded");
    Logs.Log(`Using database: ${database}`);
}

export default {
    bail: true,
    collectCoverage: true,
    coveragePathIgnorePatterns: ["__test__"],
    coverageReporters: [
        "clover",
        "json",
        "json-summary",
        "lcov",
        ["text", { skipFull: true }],
    ],
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
                outputPath: "./__test__/unit-test-report.html",
                pageTitle: "Unit Test Report",
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
