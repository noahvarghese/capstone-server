import enableMultiThreading, {
    setupMultiThreading,
} from "./util/multithreading";
import setupServer from "./util/server";

(async () => {
    if (enableMultiThreading) {
        setupMultiThreading();
    } else {
        if (
            process.argv.length > 2 &&
            ["test", "dev"].includes(process.argv[2])
        ) {
            await setupServer(false, process.argv[2] as "test" | "dev");
        } else {
            await setupServer();
        }
    }
})();
