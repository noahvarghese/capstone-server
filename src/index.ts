import setupServer from "@services/app";
import multithread from "@services/app/multithreading";

(async () => {
    await multithread(async () => {
        if (
            process.argv.length > 2 &&
            ["test", "dev"].includes(process.argv[2])
        ) {
            await setupServer(false, process.argv[2] as "test" | "dev");
        } else {
            await setupServer();
        }
    });
})();
