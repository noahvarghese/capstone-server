// eslint-disable-next-line no-undef
module.exports = {
    default: [
        "test/features/**/*.feature",
        "--require-module ts-node/register",
        "--require test/step_definitions/**/*.ts",
        "--require test/support/**/*.ts",
        "--require test/hooks/**/*.ts",
        "--publish-quiet"
    ].join(" ")
};