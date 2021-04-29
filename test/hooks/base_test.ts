import { BeforeAll, AfterAll, Before } from "@cucumber/cucumber";
import { Server } from "node:http";
import Logs from "../../src/util/logs/logs";
import setupServer from "../../src/util/server";
import BaseWorld from "../support/base_world";

let server: Server;

BeforeAll(async function () {
    const disableLogs = true;
    server = await setupServer(disableLogs);
});

AfterAll(async function () {
    Logs.Log(server);
    return await new Promise<void>((res, rej) => {
        server.close((err) => {
            if (err) {
                Logs.Test(err);
                rej(err);
            }
            res();
        });
    });
});
