// eslint-disable-next-line no-undef
module.exports = {
    default: [
        "test/bdd/features/**/*.feature",
        "--require-module ts-node/register",
        "--require test/bdd/step_definitions/**/*.ts",
        "--require test/bdd/support/**/*.ts",
        "--require test/bdd/hooks/**/*.ts",
        "--publish-quiet"
    ].join(" ")
};