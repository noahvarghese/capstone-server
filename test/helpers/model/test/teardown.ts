import BaseWorld from "../../../jest/support/base_world";
import ModelActions from "../actions";
import types from "../../../sample_data/types";
import dependencies from "../../../sample_data/dependencies";

/**
 * Assumes that the model passed is cleaned up prior to this
 * @returns model
 * @param {BaseWorld} baseWorld
 * @param {string} modelName
 */
export const teardown = async <T>(
    baseWorld: BaseWorld,
    type: new () => T,
    modelName: string
): Promise<void> => {
    const deps = dependencies[modelName as keyof typeof dependencies];

    for (let i = deps.length - 1; i > -1; i--) {
        const dependency = deps[i];

        const depType = types[dependency];

        await ModelActions.delete<typeof type>(
            baseWorld,
            depType as new () => typeof type,
            dependency
        );
    }
};
