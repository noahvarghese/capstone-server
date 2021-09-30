import { Connection } from "typeorm";

export default abstract class BaseWorld {
    public connection: Connection;
    public static errorMessage = "Base world not instantiated.";
    public _props: { [i: string]: unknown };

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
