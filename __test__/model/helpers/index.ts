import ModelTest from "..";
import attributes from "@test/model/attributes";
import dependencies from "@test/model/dependencies";
import types from "@test/model/types";
import BaseWorld from "@test/support/base_world";
import { deepClone } from "@util/obj";
import { pascalToCamel, snakeToCamel } from "@test/util/string";
import ModelActions from "./actions";

export default class Model {
    public static loadAttributes<T>(this: BaseWorld, type: new () => T): void {
        const modelName = pascalToCamel(type.name);
        const deps = dependencies[modelName as keyof typeof dependencies];

        for (const dependency of deps) {
            const attr = attributes[dependency as keyof typeof attributes]();
            this.setCustomProp(`${dependency}Attributes`, deepClone(attr));
        }

        const attr = attributes[modelName as keyof typeof attributes]();
        this.setCustomProp(`${modelName}Attributes`, deepClone(attr));
    }

    /**
     * Assums that the model passed does not exist yet
     * @returns model
     * @param {BaseWorld} baseWorld
     * @param {new () => T} type
     */
    private static async createModels<T extends Y, Y>(
        this: BaseWorld,
        type: new () => T
    ): Promise<void> {
        const setNestedProps = <X>(currentModel: string) => {
            const modelAttributesName = `${currentModel}Attributes`;
            const currentAttributes =
                this.getCustomProp<X>(modelAttributesName);

            for (const key of Object.keys(currentAttributes)) {
                if (/_id$/.test(key)) {
                    const nextModelName =
                        key === "updated_by_user_id"
                            ? "user"
                            : (snakeToCamel(
                                  key.substring(0, key.length - 3)
                              ) as ModelTest);

                    const nextType = types[nextModelName];
                    const nextModel =
                        this.getCustomProp<typeof nextType>(nextModelName);

                    currentAttributes[key as keyof X] = nextModel[
                        "id" as keyof typeof nextModel
                    ] as unknown as X[keyof X];
                }
            }

            this.setCustomProp(modelAttributesName, currentAttributes);
        };

        // get dependencies
        const modelName = pascalToCamel(type.name) as ModelTest;
        const deps = dependencies[modelName];

        for (let i = 0; i < deps.length; i++) {
            setNestedProps<Y>(deps[i]);
            await ModelActions.create(this, types[deps[i]]);
        }
        setNestedProps<Y>(modelName);
    }

    public static async setup<T extends Y, Y>(
        this: BaseWorld,
        type: new () => T
    ): Promise<void> {
        Model.loadAttributes.call(this, type);
        await Model.createModels.call(this, type);
    }
    /**
     * Assumes that the model passed is cleaned up prior to this
     * @returns model
     * @param {BaseWorld} baseWorld
     * @param {new () => T} type
     */
    public static async teardown<T>(
        this: BaseWorld,
        type: new () => T
    ): Promise<void> {
        const modelName: ModelTest = pascalToCamel(type.name) as ModelTest;
        const deps: ModelTest[] = dependencies[modelName];

        for (let i = deps.length - 1; i > -1; i--) {
            const dependency = deps[i];

            const depType = types[dependency];

            await ModelActions.delete<typeof type>(
                this,
                depType as new () => typeof type
            );
        }
    }
}
