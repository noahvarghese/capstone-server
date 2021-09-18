/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import BaseWorld from "../jest/support/base_world";
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
    key: string
) => {
    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    try {
        await testCreateModel<T, X>(baseWorld, type, key);
        throw new Error("Create should not have been succesful");
    } catch (e) {
        expect(e.message).not.toBe("Create should not have been succesful");
        if (
            (e.message as string).match(
                /^Create should not have been succesful$/
            ) === null
        ) {
            await deleteModel<T>(baseWorld, key);
        }
    }
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
    // if it does not have a key of "id" then it is a concatenated key
    // that means that we will add anything ending in _id to the where caluse if that is the case
    // otherwise the where clause will just use the id

    if (!baseWorld) {
        throw new Error(BaseWorld.errorMessage);
    }

    const { connection } = baseWorld;

    // get and set initial model
    let model = await createModel<T, X>(baseWorld, type, modelName);

    const modelAttributesName = `${modelName}Attributes`;
    const modelAttributes = baseWorld.getCustomProp<X>(modelAttributesName);

    const keys = Object.keys(model);

    // generate where clause for updating
    const whereClause: {
        placeholder: string;
        properties: { [x: string]: string };
    }[] = [];

    if (keys.includes("id")) {
        whereClause.push({
            placeholder: "id = :id",
            properties: {
                id: (model as unknown as { [name: string]: string })[
                    "id"
                ] as string,
            },
        });
    } else {
        for (const [key, value] of Object.entries(model)) {
            if (/_id$/.test(key)) {
                whereClause.push({
                    placeholder: `${key} = :${key}`,
                    properties: { [key]: value },
                });
            }
        }
    }

    // generate query builder
    let queryBuilder = connection
        .createQueryBuilder()
        .update(type)
        .set(attributesToUpdate);

    for (let i = 0; i < whereClause.length; i++) {
        const where = whereClause[i];
        if (i === 0) {
            queryBuilder = queryBuilder.where(
                where.placeholder,
                where.properties
            );
        } else {
            queryBuilder = queryBuilder.andWhere(
                where.placeholder,
                where.properties
            );
        }
    }

    // Execute query
    const result = await queryBuilder.execute();

    // check results
    expect(result.affected).toBe(1);

    // retrieve updated model
    model = await connection.manager.findOneOrFail<T>(type, {
        // reuse where clause for update
        where: whereClause.map((val) => val.properties),
    });

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
