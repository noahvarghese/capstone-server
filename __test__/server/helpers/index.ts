import setupServer, { shutdown } from "@services/app";
import { mySQLSessionStore } from "@services/app/session";
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

    public static async clearSessions(): Promise<void> {
        return new Promise<void>((res, rej) => {
            mySQLSessionStore().clear((e) => (e ? res() : rej(e)));
        });
    }
}
