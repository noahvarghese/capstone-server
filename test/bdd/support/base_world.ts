import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";

export default class BaseWorld extends World {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
