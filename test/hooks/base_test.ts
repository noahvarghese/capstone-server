import { BeforeAll, AfterAll } from "@cucumber/cucumber";

BeforeAll(() => {
    const server = require("../../src/util/server.ts");
});

AfterAll(() => {});
