require("tsconfig-paths/register");
import AppServer from "./helpers/server";

const teardown = async (): Promise<void> => {
    await AppServer.teardown();
};

export default teardown;
