import enableMultiThreading, {
    setupMultiThreading,
} from "./util/multithreading";
import setupServer from "./util/server";
import "module-alias/register";

// Run the server
(async () => {
    if (enableMultiThreading) {
        setupMultiThreading();
    } else {
        await setupServer();
    }
})();
