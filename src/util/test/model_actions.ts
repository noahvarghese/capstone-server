/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import BaseModel from "../../models/abstract/base_model";
import Logs from "../logs/logs";
import BaseWorld from "./base_world";

export const deleteModel = async <T extends BaseModel | undefined>(
    that: BaseWorld,
    type: any,
    key: string
): Promise<void> => {
    const { connection } = that;
    const model = that.getCustomProp<T>(key);

    if (model) {
        await connection.manager.delete(type, model.id);
    }

    that.setCustomProp<undefined>(key, undefined);
};

export const createModel = async <T extends BaseModel | undefined, X>(
    that: BaseWorld,
    type: any,
    key: string
): Promise<T> => {
    const { connection } = that;
    const attributes = that.getCustomProp<X>(`${key}Attributes`);

    let model = connection.manager.create<T>(type, attributes);
    model = await connection.manager.save<T>(model);

    that.setCustomProp<T | typeof type>(key, model);

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
