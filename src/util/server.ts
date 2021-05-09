import cors from "./cors";
import cookieParser from "cookie-parser";
import cluster from "cluster";
import createConnection from "../config/database";
import express from "express";
import Logs from "./logs/logs";
import middlewares from "../middleware";
import router from "../routes";
import { createSession } from "./session";
import { Server } from "http";
import fileUpload from "express-fileupload";

const port = process.env.PORT ?? 8080;

const setupServer = async (disableLogs = false): Promise<Server> => {
    Logs.configureLogs(disableLogs);
    /* Connect to database */
    /* No try catch cuz if it fails theres a bigger issue */
    await createConnection();

    const app = express();

    /* Disables header so clients don't know what server is hosting the site */
    app.disable("x-powered-by");

    /* Configure the formats to receive information */
    app.use(express.text());
    app.use(express.json());
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
    return await new Promise((res) => {
        const server = app.listen(port, () => {
            const pid = cluster.isMaster
                ? "parent process"
                : `child process ${cluster.worker.process.pid}`;

            Logs.Event(`Server started on port: ${port} using ${pid}`);
            res(server);
        });
    });
};

export default setupServer;
