import { pascalToCamel } from "../../../../src/util/string";
import BaseWorld from "../../../jest/support/base_world";
import ModelActions from "../actions";

/**
 * Executes CRUD functionality
 */
export default class ModelTestPass {
    /**
     * @template T TypeORM entity class
     * @template X the interface T implements
     * @param baseWorld
     * @param type
     */
    static create = async <T extends X, X>(
        baseWorld: BaseWorld | undefined,
        type: new () => T
    ): Promise<void> => {
        if (!baseWorld) {
            throw new Error(BaseWorld.errorMessage);
        }

        const modelName = pascalToCamel(type.name);

        const model = await ModelActions.create<T, X>(baseWorld, type);

        if (model["id" as keyof T]) {
            expect(model["id" as keyof T]).toBeGreaterThan(0);
        }

        expect(
            await ModelActions.compareModelToInterface<T, X>(
                model,
                baseWorld.getCustomProp<X>(`${modelName}Attributes`)
            )
        ).toBe(true);

        await ModelActions.delete<T>(baseWorld, type);
    };

    /**
     * Executes setup test and teardown.
     * Tests for a parent table's column preventing editing of table
     * @template T extends BaseModel, is a TypeORM Entity, this is the parent table entity
     * @template X the interface of expected column values for T
     * @param {BaseWorld | undefined} baseWorld the object to retrieve the connectoin and saved attributes from
     * @param {any} type pass T as value here
     * @param {(keyof T)[]} keys the attributes to find the model in the database by
     */
    static delete = async <T extends X, X>(
        baseWorld: BaseWorld | undefined,
        type: new () => T,
        keys: (keyof T)[]
    ): Promise<void> => {
        if (!baseWorld) {
            throw new Error(BaseWorld.errorMessage);
        }

        const { connection } = baseWorld;

        const model = await ModelActions.create<T, X>(baseWorld, type);

        await ModelActions.delete<T>(baseWorld, type);

        const where: { [index: string]: unknown } = {};

        for (const attr of keys) {
            where[attr as string] = model[attr];
        }

        const result = await connection.manager.find(type, {
            where,
        });

        expect(result.length).toBe(0);
    };

    /**
     * @template T TypeORM entity class
     * @template X the interface T implements
     * @param baseWorld
     * @param {new () => T} type T
     * @param attrKey keys to select record by
     * @param canDelete
     */
    static read = async <T extends X, X>(
        baseWorld: BaseWorld | undefined,
        type: new () => T,
        attrKey: (keyof T)[],
        canDelete = true
    ): Promise<void> => {
        if (!baseWorld) {
            throw new Error(BaseWorld.errorMessage);
        }

        const { connection } = baseWorld;

        const model = await ModelActions.create<T, X>(baseWorld, type);

        const where: Partial<T> = {};

        for (const attr of attrKey) {
            where[attr] = model[attr as keyof T];
        }

        const foundModels = await connection.manager.find(type, {
            where,
        });

        expect(foundModels.length).toBe(1);
        expect(
            await ModelActions.compareModelToInterface<T, X>(
                model,
                foundModels[0]
            )
        ).toBe(true);

        if (canDelete) {
            await ModelActions.delete<T>(baseWorld, type);
        }
    };

    /**
     *
     * @template T TypeORM entity class
     * @template X the interface T implements
     * @param baseWorld
     * @param type
     * @param attributesToUpdate
     */
    static update = async <T extends X, X>(
        baseWorld: BaseWorld | undefined,
        type: new () => T,
        attributesToUpdate: Partial<X>
    ): Promise<void> => {
        if (!baseWorld) {
            throw new Error(BaseWorld.errorMessage);
        }

        let model = await ModelActions.create<T, X>(baseWorld, type);

        model = await ModelActions.update<T, X>(
            baseWorld,
            type,
            attributesToUpdate
        );

        const modelName = pascalToCamel(type.name);

        // confirm update occurred
        expect(
            await ModelActions.compareModelToInterface<T, X>(
                model,
                baseWorld.getCustomProp<X>(`${modelName}Attributes`)
            )
        ).toBe(true);

        // cleanup
        await ModelActions.delete<T>(baseWorld, type);
    };
}
