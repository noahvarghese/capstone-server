import AppServer from "@test/server/helpers";
import DBConnection from "@test/support/db_connection";

const setup = async (): Promise<void> => {
    await DBConnection.init();
    await AppServer.setup(false);
};

export default setup;
