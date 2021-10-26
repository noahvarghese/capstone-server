import Logs from "@util/logs/logs";
import setupServer from "@util/server";
import { Server } from "http";

export default class AppServer {
    private static instance: Server;

    public static async setup(disableLogs?: boolean): Promise<void> {
        AppServer.instance = await setupServer(disableLogs, "test");
    }

    public static async teardown(): Promise<void> {
        return await new Promise<void>((res, rej) => {
            AppServer.instance.close((err) => {
                Logs.Event("Server terminated");
                if (err) {
                    Logs.Test(err);
                    rej(err);
                }
                res();
            });
        });
    }
}
