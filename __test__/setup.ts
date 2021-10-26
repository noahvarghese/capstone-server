require("tsconfig-paths/register");
import AppServer from "./helpers/server";

const setup = async (): Promise<void> => {
    await AppServer.setup(false);
    return;
};

export default setup;
