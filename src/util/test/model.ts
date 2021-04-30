/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Connection } from "typeorm";
import BaseModel from "../../models/abstract/base_model";
import BaseWorld from "./base_world";

export const deleteModel = async <T extends BaseModel>(
    that: BaseWorld,
    type: any
): Promise<void> => {
    const model = that.getCustomProp<T>("model");
    const connection = that.getCustomProp<Connection>("connection");
    await connection.manager.delete(type, model.id);
};

export const createModel = async <T extends BaseModel, X>(
    that: BaseWorld,
    type: any
): Promise<T> => {
    const attributes = that.getCustomProp<X>("attributes");
    const connection = that.getCustomProp<Connection>("connection");
    const model = await connection.manager.create<T>(type, attributes);
    that.setCustomProp<T>("model", model);
    return model;
};
