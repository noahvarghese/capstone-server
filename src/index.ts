import enableMultiThreading, {
    setupMultiThreading,
} from "./util/multithreading";
import setupServer from "./util/server";

(async () => {
    if (enableMultiThreading) {
        setupMultiThreading();
    } else {
        await setupServer();
    }
})();
