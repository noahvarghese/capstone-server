import { Connection, createConnection, getConnectionManager } from "typeorm";
import { connectionOptions, entities } from "@config/database";

export default abstract class DBConnection {
    private static _connection: Connection | undefined;
    private static readonly _connectionName: string = "Test";

    public static init = async (): Promise<void> => {
        DBConnection._connection = await createConnection({
            name: DBConnection._connectionName,
            ...connectionOptions(),
            logging: false,
        });
    };

    public static close = async (reset?: boolean): Promise<void> => {
        if (reset) await DBConnection.reset();
        await DBConnection._connection?.close();
        DBConnection._connection = undefined;
    };

    public static get = async (): Promise<Connection> => {
        // Set connection
        if (!DBConnection._connection) {
            try {
                DBConnection._connection = getConnectionManager().get(
                    DBConnection._connectionName
                );
            } catch (e) {
                await DBConnection.init();
            }
        }

        // If the connection doesn't get set
        if (!DBConnection._connection) {
            throw new Error("Could not connect to database");
        }

        return DBConnection._connection;
    };

    /**
     * Currently adds 1 second to test time
     * Better than having to fully reset the database, which adds 9 seconds
     * Just have to manually keep track of any new models
     */
    public static reset = async (): Promise<void> => {
        const connection = await DBConnection.get();

        for (const entity of entities) {
            await connection.manager.remove(
                await connection.manager.find(entity)
            );
        }
    };
}
