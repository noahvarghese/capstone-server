import JestBaseWorld from "../../../../jest/support/base_world";
import CucumberBaseWorld from "../../../../cucumber/support/base_world";
import types from "../../../../sample_data/model/types";
import attributes from "../../../../sample_data/model/attributes";
import ModelActions from "../actions";
import { pascalToCamel, snakeToCamel } from "../../../../../src/util/string";
import { deepClone } from "../../../../../src/util/obj";
import dependencies from "../../../../sample_data/model/dependencies";

export const loadAttributes = <T>(
    baseWorld: JestBaseWorld | CucumberBaseWorld,
    type: new () => T
): void => {
    const modelName = pascalToCamel(type.name);
    const deps = dependencies[modelName as keyof typeof dependencies];

    for (const dependency of deps) {
        const attr = attributes[dependency as keyof typeof attributes]();
        baseWorld.setCustomProp(`${dependency}Attributes`, deepClone(attr));
    }

    const attr = attributes[modelName as keyof typeof attributes]();
    baseWorld.setCustomProp(`${modelName}Attributes`, deepClone(attr));
};

/**
 * Assums that the model passed does not exist yet
 * @returns model
 * @param {BaseWorld} baseWorld
 * @param {new () => T} type
 */
export const createModels = async <T extends Y, Y>(
    baseWorld: JestBaseWorld | CucumberBaseWorld,
    type: new () => T
): Promise<void> => {
    const setNestedProps = <X>(currentModel: string) => {
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
    const modelName = pascalToCamel(type.name);
    const deps = dependencies[modelName];

    for (let i = 0; i < deps.length; i++) {
        setNestedProps<Y>(deps[i]);
        await ModelActions.create(baseWorld, types[deps[i]]);
    }
    setNestedProps<Y>(modelName);
};
