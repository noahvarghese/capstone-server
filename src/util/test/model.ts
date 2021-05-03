/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import BaseModel from "../../models/abstract/base_model";
import Logs from "../logs/logs";
import BaseWorld from "./base_world";

export const deleteModel = async <T extends BaseModel>(
    that: BaseWorld,
    type: any,
    stateModel?: T
): Promise<void> => {
    const { connection } = that;
    const model = stateModel ?? that.getCustomProp<T>("model");

    await connection.manager.delete(type, model.id);
};

export const createModel = async <T extends BaseModel, X>(
    that: BaseWorld,
    type: any,
    addToState = true,
    attr?: any
): Promise<T> => {
    const { connection } = that;
    const attributes = addToState ? that.getCustomProp<X>("attributes") : attr;

    let model = connection.manager.create<T>(type, attributes);
    model = await connection.manager.save<T>(model);

    if (addToState) {
        that.setCustomProp<T>("model", model);
    }

    return model;
};

export const modelMatchesInterface = <T, X extends T>(
    attr: T,
    model: X
): boolean => {
    let matches = true;

    for (const key of Object.keys(attr)) {
        const modelVal = model[key as keyof X];
        const attrVal = attr[key as keyof T];

        if ((modelVal as any) !== (attrVal as any)) {
            Logs.Test(modelVal);
            Logs.Test(attrVal);
            matches = false;
            break;
        }
    }

    return matches;
};
