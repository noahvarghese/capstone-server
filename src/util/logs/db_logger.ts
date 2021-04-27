/*
“StAuth10065: I Noah Varghese, 000753196 certify that this material is my original work. 
No other person’s work has been used without due acknowledgement. 
I have not made my work available to anyone else.”
*/
import { Logger, QueryRunner } from "typeorm";
import Logs from "./logs";

export default class DBLogger implements Logger {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    logQuery(query: string, parameters?: unknown[], _?: QueryRunner): void {
        const message = `Query executing: ${query}\nParams: ${parameters}`;
        Logs.SQL(message);
    }
    logQueryError(
        error: string | Error,
        query: string,
        parameters?: unknown[],
        queryRunner?: QueryRunner
    ): void {
        const message = `Query: ${query}\nFailed with error: ${error}\nParams: ${parameters}\nQuery Runner: ${queryRunner}`;
        Logs.Error(message);
    }
    logQuerySlow(
        time: number,
        query: string,
        parameters?: unknown[],
        queryRunner?: QueryRunner
    ): void {
        const message = `Query: ${query}\nRunning too slow at ${time}ms\nParams: ${parameters}\nQuery Runner: ${queryRunner}`;
        Logs.Warning(message);
    }
    logSchemaBuild(contents: string, queryRunner?: QueryRunner): void {
        const message = `Schema being built: ${contents}\nQuery Runner: ${queryRunner}`;
        Logs.SQL(message);
    }
    logMigration(contents: string, queryRunner?: QueryRunner): void {
        const message = `Migration being ran: ${contents}\nQuery Runner: ${queryRunner}`;
        Logs.SQL(message);
    }
    log(
        level: "log" | "info" | "warn",
        message: unknown,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _?: QueryRunner
    ): void {
        Logs.SQL(`[${level.toUpperCase()}]`, message);
    }
}
