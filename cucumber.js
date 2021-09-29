/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require("dotenv");

dotenv.config({
    path: "../.env"
});

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