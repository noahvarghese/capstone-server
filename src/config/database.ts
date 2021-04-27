import { createConnection, ConnectionOptions, Connection } from "typeorm";
import Business from "../models/business";
import Department from "../models/department";
import Permission from "../models/permission";
import Role from "../models/role";
import User from "../models/user";
import UserRole from "../models/user_role";
import DBLogger from "../util/logs/db_logger";

const connection: ConnectionOptions = {
    database: process.env.DB ?? "",
    host: process.env.DB_URL ?? "",
    username: process.env.DB_USER ?? "",
    password: process.env.DB_PWD ?? "",
    // enforce strict typing by only applying
    // a small subset of the potential database types
    type: (process.env.DB_TYPE as "mysql" | "postgres") ?? "",
    entities: [Business, User, Department, Permission, Role, UserRole],
    logging: true,
    logger: new DBLogger(),
};

export default async (): Promise<Connection> =>
    await createConnection(connection);
