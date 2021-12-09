import AppServer from "@test/server/helpers";
import DBConnection from "@test/support/db_connection";

const teardown = async (): Promise<void> => {
    await DBConnection.close();
    await AppServer.teardown();
};

export default teardown;
