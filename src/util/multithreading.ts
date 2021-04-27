import cluster, { Worker } from "cluster";
import dotenv from "dotenv";
import os from "os";
import Logs from "./logs/logs";

dotenv.config();

let enableMultiThreading = JSON.parse(
    process.env.ENABLE_MULTITHREADING ?? "false"
) as boolean;

enableMultiThreading = enableMultiThreading && cluster.isMaster;

export const setupMultiThreading = (): void => {
    const cpuCount = os.cpus().length;
    Logs.Event(`${cpuCount} CPUs found.`);

    for (let i = 0; i < cpuCount; i++) {
        cluster.fork();
    }

    cluster.on("fork", (worker: Worker) => {
        Logs.Event(`Forked process: ${worker.process.pid}`);
    });

    cluster.on("online", (worker: Worker) => {
        Logs.Event(`Worker ${worker.process.pid} is online`);
    });

    cluster.on("exit", (worker: Worker) => {
        Logs.Event(`Worker ${worker.process.pid} died.`);
    });
};

export default enableMultiThreading;
