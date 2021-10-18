/* eslint-disable no-undef */
module.exports = {
    default: [
        "test/cucumber/features/**/*.feature",
        "--require-module ts-node/register",
        "--require-module tsconfig-paths/register",
        "--require-module dotenv/config",
        "--require test/cucumber/step_definitions/**/*.ts",
        "--require test/cucumber/support/**/*.ts",
        "--require test/cucumber/hooks/**/*.ts",
        "--publish-quiet",
    ].join(" "),
    feature: [
        "--require-module ts-node/register",
        "--require-module tsconfig-paths/register",
        "--require-module dotenv/config",
        "--require test/cucumber/step_definitions/**/*.ts",
        "--require test/cucumber/support/**/*.ts",
        "--require test/cucumber/hooks/**/*.ts",
        "--publish-quiet",
    ].join(" "),
};