import setupServer, { shutdown as shutdownApp } from "@services/app";
import multithread from "@services/app/multithreading";
import { Server } from "http";
import { exit } from "process";
import { Connection } from "typeorm";

(async () => {
    let app: { server: Server; connection: Connection };

    await multithread(async () => {
        if (
            process.argv.length > 2 &&
            ["test", "dev"].includes(process.argv[2])
        ) {
            app = await setupServer(false, process.argv[2] as "test" | "dev");
        } else {
            app = await setupServer();
        }
    });

    let shutting_down = false;
    const shutdown = async () => {
        if (!shutting_down) {
            shutting_down = true;
            console.log("");
            await shutdownApp(app);
            exit();
        }
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
})();
