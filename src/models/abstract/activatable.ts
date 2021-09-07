import BaseModel from "./base_model";

export interface IActivatable {
    getTypeName(): string;
}

export const activator = (type: { new (): BaseModel }): BaseModel => {
    return new type();
};
