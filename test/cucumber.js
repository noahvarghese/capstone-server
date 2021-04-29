export default [
    "features/**/*.feature",
    "--require-module ts-node/register",
    "--require step_definitions/**/*.ts",
    "--require support/**/*.ts",
    "--require hooks/**/*.ts",
    "--publish-quiet"
].join(" ");