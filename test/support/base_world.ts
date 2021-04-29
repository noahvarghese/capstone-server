import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";

export default class BaseWorld extends World {
    private _props: any;

    constructor(options: IWorldOptions) {
        super(options);
    }

    setCustomProp = (key: string, value: any): void => {
        this._props[key] = value;
        return;
    };

    getCustomProp = (key: string): any => {
        return this._props[key];
    };
}

setWorldConstructor(BaseWorld);
