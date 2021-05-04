/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import BaseModel from "../../models/abstract/base_model";
import BaseWorld from "./base_world";
import {
    createModel,
    deleteModel,
    modelMatchesInterface,
} from "./model_actions";

export const testCreateModel = async <T extends BaseModel, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    key: string
) => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const model = await createModel<T, X>(baseWorld, type, key);

    expect(model.id).toBeGreaterThan(0);
    expect(
        modelMatchesInterface(
            baseWorld.getCustomProp<any>(`${key}Attributes`),
            model
        )
    ).toBe(true);
    await deleteModel<T>(baseWorld, type, key);
};

export const testUpdateModel = async <T extends BaseModel, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    key: string,
    attrKey: string,
    attrVal: any
) => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const modelAttributesName = `${key}Attributes`;
    const { connection } = baseWorld;

    let model = await createModel<T, X>(baseWorld, type, key);

    baseWorld.setCustomProp<X>(modelAttributesName, {
        ...baseWorld.getCustomProp<X>(modelAttributesName),
        [attrKey]: attrVal,
    });

    model[attrKey as keyof T] = attrVal;
    model = await connection.manager.save(model);

    expect(
        modelMatchesInterface(
            baseWorld.getCustomProp<any>(modelAttributesName),
            model
        )
    ).toBe(true);

    await deleteModel<T>(baseWorld, type, key);
};

export const testReadModel = async <T extends BaseModel, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    key: string,
    attrKey: string
) => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;

    const model = await createModel<T, X>(baseWorld, type, key);

    const foundModels = await connection.manager.find(type, {
        where: { [attrKey]: model[attrKey as keyof T] },
    });

    expect(foundModels.length).toBe(1);
    expect(modelMatchesInterface(model, foundModels[0] as any)).toBe(true);

    await deleteModel(baseWorld, type, key);
};

export const testDeleteModel = async <T extends BaseModel, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    key: string,
    attrKey: string
) => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;

    const model = await createModel<T, X>(baseWorld, type, key);

    await deleteModel<T>(baseWorld, type, key);

    const result = await connection.manager.find(type, {
        where: { [attrKey]: model[attrKey as keyof T] },
    });

    expect(result.length).toBe(0);
};
