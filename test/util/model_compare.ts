/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import BaseWorld from "../jest/support/base_world";
import ModelError from "./ModelError";
import {
    createModel,
    deleteModel,
    modelMatchesInterface,
    updateModel,
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
        await modelMatchesInterface(
            baseWorld.getCustomProp<any>(`${key}Attributes`),
            model
        )
    ).toBe(true);

    await deleteModel<T>(baseWorld, key);
};

export const testCreateModelFail = async <T extends X, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    key: string,
    expectedErrorMessage: RegExp | string
) => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    try {
        await testCreateModel<T, X>(baseWorld, type, key);
        throw new Error("Create should not have been succesful");
    } catch (e) {
        expect(e.message).not.toBe("Create should not have been succesful");
        expect(
            expectedErrorMessage instanceof RegExp
                ? expectedErrorMessage.test(e.message)
                : e.message === expectedErrorMessage
        ).toBe(true);

        if (!/^Create should not have been succesful$/.test(e.message)) {
            await deleteModel<T>(baseWorld, key);
        }
    }
};

export const testUpdateModelFail = async <T extends X, X>(
    baseWorld: BaseWorld | undefined,
    type: any,
    modelName: string,
    attributesToUpdate: Partial<X>,
    expectedErrorMessage: RegExp | string
): Promise<void> => {
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
        expect(
            expectedErrorMessage instanceof RegExp
                ? expectedErrorMessage.test(e.message)
                : e.message === expectedErrorMessage
        ).toBe(true);

        if (!/^Update should not have been succesful$/.test(e.message)) {
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

    const modelAttributesName = `${modelName}Attributes`;
    const modelAttributes = baseWorld.getCustomProp<X>(modelAttributesName);

    let model = await createModel<T, X>(baseWorld, type, modelName);

    model = await updateModel(baseWorld, type, modelName, attributesToUpdate);

    // store updated values
    baseWorld.setCustomProp<T>(modelName, model);

    for (const [key, value] of Object.entries(
        attributesToUpdate as Partial<X>
    ) as [keyof X, any]) {
        (modelAttributes as unknown as { [name: string]: string })[
            key as string
        ] = value;
    }

    baseWorld.setCustomProp<X>(modelAttributesName, modelAttributes);

    // confirm update occurred
    expect(
        await modelMatchesInterface<X, T>(
            baseWorld.getCustomProp<any>(modelAttributesName),
            model
        )
    ).toBe(true);

    // cleanup
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
    expect(await modelMatchesInterface(model, foundModels[0] as any)).toBe(
        true
    );

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
    expectedErrorMessage: string | RegExp
): Promise<void> => {
    const errorMessage = "Should not be successful";

    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    await createModel<T, X>(baseWorld, type, key);

    try {
        await deleteModel<T>(baseWorld, key);
        throw new Error(errorMessage);
    } catch (e) {
        expect(e.message).not.toBe(errorMessage);

        if (expectedErrorMessage instanceof RegExp) {
            expect(expectedErrorMessage.test(e.message)).toBe(true);
        } else {
            expect(e.message).toBe(expectedErrorMessage);
        }

        if (
            expectedErrorMessage instanceof RegExp
                ? expectedErrorMessage.test(e.message)
                : e.message === expectedErrorMessage
        ) {
            return;
        } else {
            throw new ModelError(
                "Unexpected error received \n" + e.message,
                e.message === errorMessage
            );
        }
    }
};
