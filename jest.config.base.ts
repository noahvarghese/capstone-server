import Logs from "@util/logs/logs";
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
    Logs.Event("Jest config loaded");
    Logs.Log(`Using database: ${database}`);
}

export default {
    bail: true,
    collectCoverage: false,
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
    reporters: ["default"],
    roots: ["src", "__test__"],
    testEnvironment: "node",
    transform: {
        "^.+\\.ts?$": "ts-jest",
    },
    verbose: false,
};
