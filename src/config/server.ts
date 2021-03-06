import cors from "./origin";
import cookieParser from "cookie-parser";
import cluster from "cluster";
import createConnection from "@config/database";
import express from "express";
import middlewares from "@middleware/index";
import router from "@routes/index";
import { createSession } from "./session";
import { Server } from "http";
import fileUpload from "express-fileupload";
import { Connection } from "typeorm";
import Logs from "@noahvarghese/logger";

const port = process.env.PORT || 8081;

// allows configuration of server for automated testing
const setupServer = async (
    disableLogs = false
): Promise<{ server: Server; connection: Connection }> => {
    Logs.init(disableLogs);
    /* Connect to database */
    /* No try catch cuz if it fails theres a bigger issue */
    const connection = await createConnection();

    const app = express();

    /* Disables header so clients don't know what server is hosting the site */
    app.disable("x-powered-by");

    /* Configure the formats to receive information */
    app.use(express.text());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(express.urlencoded({ extended: true }));
    app.use(fileUpload());

    /* Necessary for login and session fucntionality */
    app.use(cookieParser());

    /* Setup session */
    app.use(await createSession());

    /* Configure CORS */
    app.use(cors);

    /* Link all middlewares */
    app.use(...middlewares);

    /* Link all routes */
    app.use("/", router);

    /* Start the application already!!! */
    const server = await new Promise<Server>((res) => {
        const pid = cluster.isMaster
            ? "parent process"
            : `child process ${cluster.worker.process.pid}`;

        const server = app.listen(port);

        server.on("error", Logs.Error);
        server.on("listening", () => {
            Logs.Log(`Server started on port: ${port} using ${pid}`);
            res(server);
        });
    });

    return { server, connection };
};

export const shutdown = async (app: {
    server: Server;
    connection: Connection;
}): Promise<void> => {
    await Promise.all([
        new Promise<void>((res, rej) => {
            app.server.close((err) => {
                if (err) Logs.Error(err.message);

                Logs.Log("\nServer terminated\n");

                if (err) {
                    rej(err);
                }
                res();
            });
        }),
        app.connection.close(),
    ]);
};

export default setupServer;
