import { createConnection, ConnectionOptions, Connection } from "typeorm";
import DBLogger from "../util/logs/db_logger";

const connection: ConnectionOptions = {
    database: process.env.DB ?? "",
    host: process.env.DB_URL ?? "",
    username: process.env.DB_USER ?? "",
    password: process.env.DB_PWD ?? "",
    // enforce strict typing by only applying
    // a small subset of the potential database types
    type: (process.env.DB_TYPE as "mysql" | "postgres") ?? "",
    entities: [],
    logging: true,
    logger: new DBLogger(),
};

export default async (): Promise<Connection> =>
    await createConnection(connection);
