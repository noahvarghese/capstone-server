import cors from "./origin";
import cookieParser from "cookie-parser";
import cluster from "cluster";
import createConnection from "@config/database";
import express from "express";
import Logs from "@util/logs/logs";
import middlewares from "@middleware/index";
import router from "@routes/index";
import { createSession } from "./session";
import { Server } from "http";
import fileUpload from "express-fileupload";

const port = process.env.PORT || 8081;

// allows configuration of server for automated testing
const setupServer = async (
    disableLogs = false,
    env?: "test" | "dev"
): Promise<Server> => {
    Logs.configureLogs(disableLogs);
    /* Connect to database */
    /* No try catch cuz if it fails theres a bigger issue */
    await createConnection(env);

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
    return await new Promise<Server>((res) => {
        const pid = cluster.isMaster
            ? "parent process"
            : `child process ${cluster.worker.process.pid}`;

        const server = app.listen(port);

        server.on("error", Logs.Error);

        server.on("listening", () => {
            Logs.Event(`Server started on port: ${port} using ${pid}`);
            res(server);
        });
    });
};

export default setupServer;