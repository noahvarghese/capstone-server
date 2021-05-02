/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import BaseModel from "../../models/abstract/base_model";
import BaseWorld from "./base_world";

export const deleteModel = async <T extends BaseModel>(
    that: BaseWorld,
    type: any
): Promise<void> => {
    const { connection } = that;
    const model = that.getCustomProp<T>("model");

    await connection.manager.delete(type, model.id);
};

export const createModel = async <T extends BaseModel, X>(
    that: BaseWorld,
    type: any
): Promise<T> => {
    const { connection } = that;
    const attributes = that.getCustomProp<X>("attributes");

    let model = connection.manager.create<T>(type, attributes);
    model = await connection.manager.save<T>(model);

    that.setCustomProp<T>("model", model);

    return model;
};
