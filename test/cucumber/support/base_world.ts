import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";
// import { deepClone } from "@util/obj";
import { deepClone } from "../../../src/util/obj";
import { Connection } from "typeorm";

/**
 * Only way to modify tags is to set them
 */
export default class CucumberBaseWorld extends World {
    private _connection: Connection | undefined;
    public static errorMessage = "Base world not instantiated.";
    private _props: { [i: string]: unknown };
    private _tags: string[] = [];

    constructor(options: IWorldOptions) {
        super(options);
        this._props = {};
    }

    setConnection(connection: Connection): void {
        this._connection = connection;
    }

    clearConnection(): void {
        delete this._connection;
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

    setTags(newTags: string[]): void {
        this._tags = newTags;
    }

    hasTag(searchVal: string): boolean {
        return this._tags.includes(searchVal);
    }

    /**
     * @returns deep copy of tags
     */
    getTags(): string[] {
        return deepClone(this._tags);
    }
}

setWorldConstructor(CucumberBaseWorld);
