/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import BaseWorld from "./base_world";
import {
    createModel,
    deleteModel,
    modelMatchesInterface,
} from "./model_actions";

interface WhereClause {
    [index: string]: any;
}

export const testCreateModel = async <T, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    key: string
) => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const model = await createModel<T, X>(baseWorld, type, key);

    if (model["id" as keyof T]) {
        expect(model["id" as keyof T]).toBeGreaterThan(0);
    }

    expect(
        modelMatchesInterface(
            baseWorld.getCustomProp<any>(`${key}Attributes`),
            model
        )
    ).toBe(true);

    await deleteModel<T>(baseWorld, type, key);
};

export const testUpdateModel = async <T, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    key: string,
    attrKey: keyof T,
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

    model[attrKey] = attrVal;
    model = await connection.manager.save(model);

    expect(
        modelMatchesInterface(
            baseWorld.getCustomProp<any>(modelAttributesName),
            model
        )
    ).toBe(true);

    if (model["updated_on" as keyof T]) {
        expect(model["updated_on" as keyof T]).toBeTruthy();
    }

    await deleteModel<T>(baseWorld, type, key);
};

export const testReadModel = async <T, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    key: string,
    attrKey: string[]
) => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;

    const model = await createModel<T, X>(baseWorld, type, key);

    const where: WhereClause = {};

    for (const attr of attrKey) {
        where[attr] = model[attr as keyof T];
    }

    const foundModels = await connection.manager.find(type, {
        where,
    });

    expect(foundModels.length).toBe(1);
    expect(modelMatchesInterface(model, foundModels[0] as any)).toBe(true);

    await deleteModel(baseWorld, type, key);
};

export const testDeleteModel = async <T, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    key: string,
    attrKey: string[]
) => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;

    const model = await createModel<T, X>(baseWorld, type, key);

    await deleteModel<T>(baseWorld, type, key);
    const where: WhereClause = {};

    for (const attr of attrKey) {
        where[attr] = model[attr as keyof T];
    }

    const result = await connection.manager.find(type, {
        where,
    });

    expect(result.length).toBe(0);
};
