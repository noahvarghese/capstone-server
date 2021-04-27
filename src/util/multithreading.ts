import cluster, { Worker } from "cluster";
import dotenv from "dotenv";
import os from "os";
import Logs, { LogLevels } from "./logs";

dotenv.config();

let enableMultiThreading = JSON.parse(
    process.env.ENABLE_MULTITHREADING ?? "false"
) as boolean;

enableMultiThreading = enableMultiThreading && cluster.isMaster;

export const setupMultiThreading = (): void => {
    const cpuCount = os.cpus().length;
    Logs.addLog(`${cpuCount} CPUs found.`, LogLevels.EVENT);

    for (let i = 0; i < cpuCount; i++) {
        cluster.fork();
    }

    cluster.on("fork", (worker: Worker) => {
        Logs.addLog(`Forked process: ${worker.process.pid}`, LogLevels.EVENT);
    });

    cluster.on("online", (worker: Worker) => {
        Logs.addLog(`Worker ${worker.process.pid} is online`, LogLevels.EVENT);
    });

    cluster.on("exit", (worker: Worker) => {
        Logs.addLog(`Worker ${worker.process.pid} died.`, LogLevels.EVENT);
    });
};

export default enableMultiThreading;
