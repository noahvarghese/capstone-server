import Logs from "@noahvarghese/logger";
import cluster, { Worker } from "cluster";
import dotenv from "dotenv";
import os from "os";

dotenv.config();

let enableMultiThreading = JSON.parse(
    process.env.ENABLE_MULTITHREADING ?? "false"
) as boolean;

enableMultiThreading = enableMultiThreading && cluster.isMaster;

export const setupMultiThreading = (): void => {
    const cpuCount = os.cpus().length;
    Logs.Log(`${cpuCount} CPUs found.`);

    for (let i = 0; i < cpuCount; i++) {
        cluster.fork();
    }

    cluster.on("fork", (worker: Worker) => {
        Logs.Log(`Forked process: ${worker.process.pid}`);
    });

    cluster.on("online", (worker: Worker) => {
        Logs.Log(`Worker ${worker.process.pid} is online`);
    });

    cluster.on("exit", (worker: Worker) => {
        Logs.Log(`Worker ${worker.process.pid} died.`);
    });
};

const multithread = async (fn: () => void | Promise<void>): Promise<void> => {
    if (enableMultiThreading) {
        setupMultiThreading();
    } else {
        await fn();
    }
};

export default multithread;
