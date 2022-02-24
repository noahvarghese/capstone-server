import setupServer, { shutdown } from "./server";

test("server", async () => {
    const server = await setupServer();
    await shutdown(server);
});
