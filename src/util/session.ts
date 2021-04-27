import dotenv from "dotenv";
import { RequestHandler } from "express";
import * as core from "express-serve-static-core";
import MySQLStore from "express-mysql-session";
import * as session from "express-session";
import Logs from "./logs";

dotenv.config();

export interface SessionData {
    // TODO Replacewith user model
    user: unknown;
}

declare module "express-session" {
    export interface SessionData {
        user_id: number;
        long_term_care_home_id: number;
    }
}

const mySQLSessionStore = new (MySQLStore(session))({
    database: process.env.DB ?? "",
    host: process.env.DB_URL ?? "",
    user: process.env.DB_USER ?? "",
    password: process.env.DB_PWD ?? "",
    port: Number(process.env.DB_PORT) ?? undefined,
    expiration: 8 * 60 * 60 * 1000,
    createDatabaseTable: true,
});

export const createSessionTable = async (): Promise<void> => {
    return new Promise((res, rej) => {
        mySQLSessionStore.createDatabaseTable((err) => {
            if (err) {
                Logs.Error(err);
                rej(err);
            }
            res();
        });
    });
};

export const createSession = async (): Promise<
    RequestHandler<
        core.ParamsDictionary,
        unknown,
        unknown,
        core.Query,
        Record<string, unknown>
    >
> => {
    // Fail if the session table does not exist
    await createSessionTable();

    // Requires a table in the database to store the info
    return session.default({
        name: process.env.SESSION_ID ?? "sid",
        secret: process.env.SESSION_SECRET ?? "",
        resave: true,
        rolling: true,
        saveUninitialized: false,
        cookie: {
            maxAge: 8 * 60 * 60 * 1000,
            sameSite: "lax",
        },
        unset: "destroy",
        store: mySQLSessionStore,
    });
};
