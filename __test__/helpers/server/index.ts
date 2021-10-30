import setupServer, { shutdown } from "@services/app";
import { Server } from "http";
import { Connection } from "typeorm";

export default class AppServer {
    private static app: { server: Server; connection: Connection };

    public static async setup(disableLogs?: boolean): Promise<void> {
        this.app = await setupServer(disableLogs, "test");
    }

    public static async teardown(): Promise<void> {
        await shutdown(this.app);
    }
}
