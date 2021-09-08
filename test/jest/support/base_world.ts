/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection } from "typeorm";

export default class BaseWorld {
    public connection: Connection;
    // public static Error: Error = new Error("Base world not instantiated.");
    public static errorMessage = "Base world not instantiated.";
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
