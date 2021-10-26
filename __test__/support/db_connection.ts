import { Connection, createConnection, getConnectionManager } from "typeorm";
import { connectionOptions } from "@config/database";

export default abstract class DBConnection {
    private static _connection: Connection | undefined;
    private static readonly _connectionName: string = "Test";

    public static InitConnection = async (): Promise<void> => {
        DBConnection._connection = await createConnection({
            name: DBConnection._connectionName,
            ...connectionOptions("_test"),
            logging: false,
        });
    };

    public static CloseConnection = async (): Promise<void> => {
        await DBConnection._connection?.close();
        DBConnection._connection = undefined;
    };

    public static GetConnection = async (): Promise<Connection> => {
        // Set connection
        if (!DBConnection._connection) {
            try {
                DBConnection._connection = getConnectionManager().get(
                    DBConnection._connectionName
                );
            } catch (e) {
                await DBConnection.InitConnection();
            }
        }

        // If the connection doesn't get set
        if (!DBConnection._connection) {
            throw new Error("Could not connect to database");
        }

        return DBConnection._connection;
    };
}