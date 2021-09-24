import BaseWorld from "../../../jest/support/base_world";
import types from "../../../sample_data/types";
import attributes from "../../../sample_data/attributes";
import ModelActions from "../actions";
import { snakeToCamel } from "../../../../src/util/string";
import { deepClone } from "../../../../src/util/obj";
import dependencies from "../../../sample_data/dependencies";

export const loadAttributes = (
    baseWorld: BaseWorld,
    modelName: string
): void => {
    const deps = dependencies[modelName as keyof typeof dependencies];

    for (const dependency of deps) {
        const attr = attributes[dependency as keyof typeof attributes];
        baseWorld.setCustomProp(`${dependency}Attributes`, deepClone(attr));
    }

    const attr = attributes[modelName as keyof typeof attributes];
    baseWorld.setCustomProp(`${modelName}Attributes`, deepClone(attr));
};

/**
 * Assums that the model passed does not exist yet
 * @returns model
 * @param {BaseWorld} baseWorld
 * @param {string} modelName
 * @param {boolean} skipRun whether to instantiate in the database
 */
export const createModels = async (
    baseWorld: BaseWorld,
    startingModelName: string
): Promise<void> => {
    const getNestedProps = <X>(currentModel: string) => {
        const modelAttributesName = `${currentModel}Attributes`;
        const currentAttributes =
            baseWorld.getCustomProp<X>(modelAttributesName);

        for (const key of Object.keys(currentAttributes)) {
            if (/_id$/.test(key)) {
                const nextModelName =
                    key === "updated_by_user_id"
                        ? "user"
                        : snakeToCamel(key.substring(0, key.length - 3));

                const nextType = types[nextModelName];
                const nextModel =
                    baseWorld.getCustomProp<typeof nextType>(nextModelName);

                currentAttributes[key as keyof X] = nextModel[
                    "id" as keyof typeof nextModel
                ] as unknown as X[keyof X];
            }
        }

        baseWorld.setCustomProp(modelAttributesName, currentAttributes);
    };

    // get dependencies
    const deps = dependencies[startingModelName];

    for (let i = 0; i < deps.length; i++) {
        getNestedProps(deps[i]);
        await ModelActions.create(baseWorld, types[deps[i]], deps[i]);
    }
    getNestedProps(startingModelName);
};
