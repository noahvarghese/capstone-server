/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import BaseWorld from "./store";
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

    await deleteModel<T>(baseWorld, key);
};

export const testUpdateModelFail = async <T extends X, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    modelName: string,
    attributesToUpdate: Partial<X>
) => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    try {
        await testUpdateModel<T, X>(
            baseWorld,
            type,
            modelName,
            attributesToUpdate
        );
        throw new Error("Update should not have been succesful");
    } catch (e) {
        expect(e.message).not.toBe("Update should not have been succesful");
        if (
            (e.message as string).match(
                /^Update should not have been succesful$/
            ) === null
        ) {
            await deleteModel<T>(baseWorld, modelName);
        }
    }
};

export const testUpdateModel = async <T extends X, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    modelName: string,
    attributesToUpdate: Partial<X>
) => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;
    let model = await createModel<T, X>(baseWorld, type, modelName);
    const modelAttributesName = `${modelName}Attributes`;

    for (const [key, value] of Object.entries(
        attributesToUpdate as Partial<X>
    ) as [keyof X, any]) {
        baseWorld.setCustomProp<X>(modelAttributesName, {
            ...baseWorld.getCustomProp<X>(modelAttributesName),
            [key]: value,
        });

        if (
            model[key as keyof X] ===
            (baseWorld.getCustomProp<X>(modelAttributesName) as any)[key]
        ) {
            throw new Error("Object hasn't changed");
        }

        model[key as keyof T] = value;
    }
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

    await deleteModel<T>(baseWorld, modelName);
};

export const testReadModel = async <T, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    key: string,
    attrKey: string[],
    canDelete = true
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

    if (canDelete) {
        await deleteModel(baseWorld, key);
    }
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

    await deleteModel<T>(baseWorld, key);
    const where: WhereClause = {};

    for (const attr of attrKey) {
        where[attr] = model[attr as keyof T];
    }

    const result = await connection.manager.find(type, {
        where,
    });

    expect(result.length).toBe(0);
};

export const testDeleteModelFail = async <T, X>(
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

    try {
        await deleteModel<T>(baseWorld, key);
    } catch (e) {
        expect(e).toBeTruthy();
    }

    const where: WhereClause = {};
    for (const attr of attrKey) {
        where[attr] = model[attr as keyof T];
    }

    const result = await connection.manager.find(type, {
        where,
    });

    expect(result.length).toBe(1);
};
