import { Connection, createConnection } from "typeorm";
import { connectionOptions } from "@config/database";

export default class DBConnection {
    private static _connection: Connection | undefined;

    public static InitConnection = async (): Promise<void> => {
        DBConnection._connection = await createConnection({
            name: "Test",
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
            await DBConnection.InitConnection();
        }

        // If the connection doesn't get set
        if (!DBConnection._connection) {
            throw new Error("Could not connect to database");
        }

        return DBConnection._connection;
    };
}
