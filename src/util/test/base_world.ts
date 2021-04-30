import { Connection } from "typeorm";

export default class BaseWorld {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public connection: Connection;
    public static Error: Error = new Error("Base world not instantiated.");
    private _props: any;

    constructor(_connection: Connection) {
        this.connection = _connection;
        this._props = {};
    }

    setCustomProp = <T>(key: string, value: T): void => {
        this._props[key] = value;
        return;
    };

    getCustomProp = <T>(key: string): T => {
        return this._props[key] as T;
    };
}
