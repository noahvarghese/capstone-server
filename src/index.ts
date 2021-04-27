import enableMultiThreading, {
    setupMultiThreading,
} from "./util/multithreading";
import setupServer from "./util/server";

// Run the server
(async () => {
    if (enableMultiThreading) {
        setupMultiThreading();
    } else {
        await setupServer();
    }
})();
