import cors from "./cors";
import cookieParser from "cookie-parser";
import cluster from "cluster";
import express from "express";
import Logs from "./logs";
import middlewares from "../middleware";
import router from "../routes";
import { createSession } from "./session";

const port = process.env.PORT ?? 8080;

const setupServer = async (): Promise<void> => {
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
        Logs.Event(
            `Server started on port: ${port} using ${
                cluster.isMaster
                    ? "parent process"
                    : cluster.isWorker
                    ? `child process ${cluster.worker.process.pid}`
                    : undefined
            }`
        );
    });
};

export default setupServer;
