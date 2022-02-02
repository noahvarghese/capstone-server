import setupServer, { shutdown } from "@config/server";
import { Server } from "http";
import { Connection } from "typeorm";

export default class AppServer {
    private static app: { server: Server; connection: Connection };

    public static async setup(disableLogs?: boolean): Promise<void> {
        this.app = await setupServer(disableLogs);
    }

    public static async teardown(): Promise<void> {
        await shutdown(this.app);
    }
}
