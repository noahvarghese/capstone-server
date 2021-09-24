import BaseWorld from "../../../jest/support/base_world";
import ModelActions from "../actions";

export default class ModelTestParentPrevent {
    /**
     * Executes setup test and teardown.
     * Tests for a parent table's column preventing editing of table
     * @template T extends BaseModel, is a TypeORM Entity, this is the parent table entity
     * @template X the interface of expected column values for T
     * @template S extends BaseModel, is a TypeORM Entity, this is the child table entity
     * @template Y the interface of expected column values for S
     * @param {BaseWorld} baseWorld the object to retrieve the connectoin and saved attributes from
     * @param {{type: any; modelName: string; toggleAttribute: keyof T}} parentOptions details of the parent class to perform setup and teardown
     * @param {{type: any; modelName: string; attributesToUpdate: Partial<Y>}} modelOptions details of the child class to execute test
     * @param {RegExp | string} expectedErrorMessage the valid error message to determine the test was successful
     * @param {RegExp | string} errorMessageToIgnore the expected error message when initial cleanup fails, this allows the test process to continue
     */
    static update = async <T extends X, X, S extends Y, Y>(
        baseWorld: BaseWorld | undefined,
        parentOptions: {
            type: new () => T;
            modelName: string;
            toggleAttribute: keyof T;
        },
        modelOptions: {
            type: new () => S;
            modelName: string;
            attributesToUpdate: Partial<Y>;
        },
        expectedErrorMessage: RegExp | string
    ): Promise<void> => {
        if (!baseWorld) {
            throw new Error(BaseWorld.errorMessage);
        }

        let errorThrown = false;

        // setup entity
        await ModelActions.create<S, Y>(
            baseWorld,
            modelOptions.type,
            modelOptions.modelName
        );

        // turn on edit prevention in parent
        await ModelActions.update<T, X>(
            baseWorld,
            parentOptions.type,
            parentOptions.modelName,
            {
                [parentOptions.toggleAttribute]: true,
            } as unknown as Partial<X>
        );

        try {
            // try update child
            await ModelActions.update<S, Y>(
                baseWorld,
                modelOptions.type,
                modelOptions.modelName,
                modelOptions.attributesToUpdate
            );
        } catch (e) {
            errorThrown = true;

            expect(
                expectedErrorMessage instanceof RegExp
                    ? expectedErrorMessage.test(e.message)
                    : e.message === expectedErrorMessage
            ).toBe(true);
        }

        expect(errorThrown).toBe(true);

        // turn off edit lock
        await ModelActions.update<T, X>(
            baseWorld,
            parentOptions.type,
            parentOptions.modelName,
            {
                [parentOptions.toggleAttribute]: false,
            } as unknown as Partial<X>
        );

        // cleanup
        await ModelActions.delete<S>(baseWorld, modelOptions.modelName);
    };

    /**
     * Executes setup test and teardown.
     * Tests for a parent table's column preventing deletion of table
     * @template T extends BaseModel, is a TypeORM Entity, this is the parent table entity
     * @template X the interface of expected column values for T
     * @template S extends BaseModel, is a TypeORM Entity, this is the child table entity
     * @template Y the interface of expected column values for S
     * @param {BaseWorld} baseWorld the object to retrieve the connectoin and saved attributes from
     * @param {{type: any; modelName: string; toggleAttribute: keyof T}} parentOptions details of the parent class to perform setup and teardown
     * @param {{type: any; modelName: string;}} modelOptions details of the child class to execute test
     * @param {RegExp | string} expectedErrorMessage the valid error message to determine the test was successful
     */
    static delete = async <T extends X, X, S extends Y, Y>(
        baseWorld: BaseWorld | undefined,
        parentOptions: {
            type: new () => T;
            modelName: string;
            toggleAttribute: keyof T;
        },
        modelOptions: {
            type: new () => S;
            modelName: string;
        },
        expectedErrorMessage: RegExp | string
    ): Promise<void> => {
        if (!baseWorld) {
            throw new Error(BaseWorld.errorMessage);
        }

        let errorThrown = false;

        // setup
        await ModelActions.create<S, Y>(
            baseWorld,
            modelOptions.type,
            modelOptions.modelName
        );

        // turn on edit lock
        await ModelActions.update<T, X>(
            baseWorld,
            parentOptions.type,
            parentOptions.modelName,
            {
                [parentOptions.toggleAttribute]: true,
            } as unknown as Partial<X>
        );

        // test
        try {
            await ModelActions.delete<S>(baseWorld, modelOptions.modelName);
        } catch (e) {
            errorThrown = true;

            expect(
                expectedErrorMessage instanceof RegExp
                    ? expectedErrorMessage.test(e.message)
                    : e.message === expectedErrorMessage
            ).toBe(true);
        }

        expect(errorThrown).toBe(true);

        // cleanup
        // turn off edit lock
        await ModelActions.update<T, X>(
            baseWorld,
            parentOptions.type,
            parentOptions.modelName,
            {
                [parentOptions.toggleAttribute]: false,
            } as unknown as Partial<X>
        );

        await ModelActions.delete<S>(baseWorld, modelOptions.modelName);
    };
}
