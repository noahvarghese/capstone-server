// eslint-disable-next-line no-undef
module.exports = {
    default: [
        "test/cucumber/features/**/*.feature",
        "--require-module ts-node/register",
        "--require test/cucumber/step_definitions/**/*.ts",
        "--require test/cucumber/support/**/*.ts",
        "--require test/cucumber/hooks/**/*.ts",
        "--publish-quiet"
    ].join(" ")
};