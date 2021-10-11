import JestBaseWorld from "../../../support/base_world";
import CucumberBaseWorld from "../../../../cucumber/support/base_world";
import ModelActions from "../actions";
import types from "../../../../sample_data/model/types";
import dependencies from "../../../../sample_data/model/dependencies";
import { pascalToCamel } from "../../../../../src/util/string";
/**
 * Assumes that the model passed is cleaned up prior to this
 * @returns model
 * @param {BaseWorld} baseWorld
 * @param {new () => T} type
 */
export const teardown = async <T>(
    baseWorld: JestBaseWorld | CucumberBaseWorld,
    type: new () => T
): Promise<void> => {
    const modelName = pascalToCamel(type.name);
    const deps = dependencies[modelName as keyof typeof dependencies];

    for (let i = deps.length - 1; i > -1; i--) {
        const dependency = deps[i];

        const depType = types[dependency];

        await ModelActions.delete<typeof type>(
            baseWorld,
            depType as new () => typeof type
        );
    }
};
