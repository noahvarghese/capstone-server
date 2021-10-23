import { Connection } from "typeorm";

export default class JestBaseWorld {
    private _connection: Connection | undefined;
    public static errorMessage = "Base world not instantiated.";
    private _props: { [i: string]: unknown };

    constructor(connection: Connection) {
        this._connection = connection;
        this._props = {};
    }

    setConnection(connection: Connection): void {
        this._connection = connection;
    }

    async clearConnection(): Promise<void> {
        await this._connection?.close();
    }

    getConnection(): Connection {
        if (!this._connection) {
            throw new Error("connection is not defined");
        }

        return this._connection;
    }


    setCustomProp<T>(key: string, value: T): void {
        this._props[key] = value;
        return;
    }

    getCustomProp<T>(key: string): T {
        return this._props[key] as T;
    }
}
