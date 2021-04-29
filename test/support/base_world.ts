import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";
import Logs from "../../src/util/logs/logs";

export default class BaseWorld extends World {
    private _props: any;

    constructor(options: IWorldOptions) {
        super(options);
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

setWorldConstructor(BaseWorld);
