import DBConnection from "@test/support/db_connection";
import BaseWorld from "@test/support/base_world";

export default abstract class Database {
    public static async setup(this: BaseWorld): Promise<void> {
        this.setConnection(await DBConnection.GetConnection());
    }

    public static async teardown(this: BaseWorld): Promise<void> {
        await this.clearConnection();
    }
}
