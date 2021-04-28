import cors from "./cors";
import cookieParser from "cookie-parser";
import cluster from "cluster";
import createConnection from "../config/database";
import express from "express";
import Logs from "./logs/logs";
import middlewares from "../middleware";
import router from "../routes";
import { createSession } from "./session";
import { getLocationData } from "./geolocation";

const port = process.env.PORT ?? 8080;

const setupServer = async (): Promise<void> => {
    /* Connect to database */
    /* No try catch cuz if it fails theres a bigger issue */
    await createConnection();

    const app = express();

    /* Disables header so clients don't know what server is hosting the site */
    app.disable("x-powered-by");

    /* Configure the formats to receive information */
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

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
    app.listen(port, () => {
        const pid = cluster.isMaster
            ? "parent process"
            : `child process ${cluster.worker.process.pid}`;

        Logs.Event(`Server started on port: ${port} using ${pid}`);
    });

    await getLocationData();
};

export default setupServer;
