import setupServer from "@util/server";
import { Server } from "http";
import { promisify } from "util";

export default class AppServer {
    private static instance: Server;

    public static async start(): Promise<void> {
        AppServer.instance = await setupServer();
    }

    public static async stop(): Promise<void> {
        const close = promisify(AppServer.instance.close);
        await close().then(console.error);
    }
}
