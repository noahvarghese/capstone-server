import BaseWorld from "../../../jest/support/base_world";
import ModelActions from "../actions";

/**
 * Executes basic CRUD functionality but expects failures
 */
export default class ModelTestFail {
    /**
     * Executes create model on database, expects failure
     * @template T the TypeORM entity class
     * @template X the interface the class implements
     * @param baseWorld
     * @param type
     * @param modelName
     * @param expectedErrorMessage
     */
    static create = async <T extends X, X>(
        baseWorld: BaseWorld | undefined,
        type: new () => T,
        modelName: string,
        expectedErrorMessage: RegExp | string
    ): Promise<void> => {
        if (!baseWorld) {
            throw new Error(BaseWorld.errorMessage);
        }

        let errorThrown = false;

        try {
            await ModelActions.create<T, X>(baseWorld, type, modelName);
        } catch (e) {
            errorThrown = true;

            expect(
                expectedErrorMessage instanceof RegExp
                    ? expectedErrorMessage.test(e.message)
                    : e.message === expectedErrorMessage
            ).toBe(true);

            await ModelActions.delete<T>(baseWorld, type, modelName);
        }

        expect(errorThrown).toBe(true);
    };

    /**
     * Deletes a model from the database, expects failue
     * @template T the TypeORM entity class
     * @template X the interface T implements
     * @param baseWorld
     * @param type
     * @param modelName
     * @param expectedErrorMessage
     */
    static delete = async <T extends X, X>(
        baseWorld: BaseWorld | undefined,
        type: new () => T,
        modelName: string,
        expectedErrorMessage: string | RegExp
    ): Promise<void> => {
        if (!baseWorld) {
            throw new Error(BaseWorld.errorMessage);
        }

        let errorThrown = false;

        await ModelActions.create<T, X>(baseWorld, type, modelName);

        try {
            await ModelActions.delete<T>(baseWorld, type, modelName);
        } catch (e) {
            errorThrown = true;
            expect(
                expectedErrorMessage instanceof RegExp
                    ? expectedErrorMessage.test(e.message)
                    : e.message === expectedErrorMessage
            ).toBe(true);
        }

        expect(errorThrown).toBe(true);
    };

    /**
     * Executes update expecting to fail
     * @template T TypeORM entity class
     * @template X Interface that T is based off of
     * @param {BaseWorld} baseWorld
     * @param {new () => T} type same value as passed as T
     * @param modelName the name of the class
     * @param attributesToUpdate attributes to change
     * @param expectedErrorMessage error message that would pass this test
     */
    static update = async <T extends X, X>(
        baseWorld: BaseWorld | undefined,
        type: new () => T,
        modelName: string,
        attributesToUpdate: Partial<X>,
        expectedErrorMessage: RegExp | string
    ): Promise<void> => {
        if (!baseWorld) {
            throw new Error(BaseWorld.errorMessage);
        }

        let errorThrown = false;
        await ModelActions.create<T, X>(baseWorld, type, modelName);

        try {
            await ModelActions.update<T, X>(
                baseWorld,
                type,
                modelName,
                attributesToUpdate
            );
        } catch (e) {
            errorThrown = true;
            expect(
                expectedErrorMessage instanceof RegExp
                    ? expectedErrorMessage.test(e.message)
                    : e.message === expectedErrorMessage
            ).toBe(true);

            await ModelActions.delete<T>(baseWorld, type, modelName);
        }

        expect(errorThrown).toBe(true);
    };
}
