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
    transform: {
        '^.+\\.ts?$': 'ts-jest'
    },
    testEnvironment: 'node',
    testRegex: '/src/.*\\.(test|spec)?\\.(ts|tsx)$',
    moduleDirectories: ["node_modules", "./"],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
    setupFilesAfterEnv: ["./jest.setup.js"],
    roots: ["./"],
};