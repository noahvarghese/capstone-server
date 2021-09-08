import { BeforeAll, AfterAll } from "@cucumber/cucumber";
import { Server } from "node:http";
import Logs from "../../../src/util/logs/logs";
import setupServer from "../../../src/util/server";

let server: Server;

BeforeAll(async function () {
    const disableLogs = true;
    server = await setupServer(disableLogs, "test");
});

AfterAll(async function () {
    await new Promise<void>((res, rej) => {
        server.close((err) => {
            if (err) {
                Logs.Test(err);
                rej(err);
            }
            res();
        });
    });

    return;
});
