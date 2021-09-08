/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import JestBaseWorld from "../jest/support/base_world";
import CucumberBaseWorld from "../cucumber/support/base_world";
import { Connection } from "typeorm";
import User from "../../src/models/user/user";

export const deleteModel = async <T>(
    that: JestBaseWorld | CucumberBaseWorld,
    key: string
): Promise<void> => {
    const connection =
        that instanceof JestBaseWorld
            ? that.connection
            : that.getCustomProp<Connection>("connection");

    const model = that.getCustomProp<T | undefined>(key);

    if (model !== undefined) {
        await connection.manager.remove<T>(model);
        that.setCustomProp<undefined>(key, undefined);
    }
};

export const createModel = async <T, X>(
    that: JestBaseWorld | CucumberBaseWorld,
    type: any,
    key: string
): Promise<T> => {
    const connection =
        that instanceof JestBaseWorld
            ? that.connection
            : that.getCustomProp<Connection>("connection");
    const attributes = that.getCustomProp<X>(`${key}Attributes`);

    let model = connection.manager.create<T>(type, attributes);

    // handle automatic creation
    if (model instanceof User) {
        await model.hashPassword(model.password);
    }

    model = await connection.manager.save<T>(model);

    that.setCustomProp<T>(key, model);

    return model;
};

export const modelMatchesInterface = async <T, X extends T>(
    attr: T,
    model: X
): Promise<boolean> => {
    let matches = true;

    for (const key of Object.keys(attr)) {
        const modelVal = model[key as keyof X];
        const attrVal = attr[key as keyof T];

        if (key === "password" && model instanceof User) {
            if (await model.comparePassword(attrVal as any as string)) {
                continue;
            }
        }

        if (typeof modelVal !== "function") {
            // Loose equals
            if ((modelVal as any) !== (attrVal as any)) {
                // Handle Dates
                if (
                    Object.prototype.toString.call(modelVal) === "[object Date]"
                ) {
                    const d1 = new Date(modelVal as any);
                    const d2 = new Date(attrVal as any);

                    if (d1.getTime() === d2.getTime()) {
                        continue;
                    }
                }

                // Handle numbers
                if (
                    typeof modelVal === "number" ||
                    typeof attrVal === "number"
                ) {
                    if (Number(modelVal) === Number(attrVal)) {
                        continue;
                    }
                }

                // handle undefined and null
                if (!modelVal && !attrVal) {
                    continue;
                }

                matches = false;

                break;
            }
        }
    }

    return matches;
};
