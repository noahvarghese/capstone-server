import { AfterAll, Before, BeforeAll } from "@cucumber/cucumber";
import BaseWorld from "../support/base_world";
import fetch from "node-fetch";

import dotenv from "dotenv";
dotenv.config();

BeforeAll(() => {
    // Set DB Connection
    // Create rows
    // Store ids
});

AfterAll(() => {
    // Get connection
    // Delete rows
});

Before({ tags: "@AuthRequired" }, async function (this: BaseWorld) {
    // Login qa user
});
