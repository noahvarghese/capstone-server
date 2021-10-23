import JestBaseWorld from "../../../support/base_world";
import CucumberBaseWorld from "../../../cucumber/support/base_world";
import User from "../../../../src/models/user/user";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import {
    checkType,
    formatter,
    FormatType,
    pascalToCamel,
} from "../../../../src/util/string";

/**
 * Performs CRUD actions without assertions
 */
export default class ModelActions {
    //#region Get Keys

    /**
     * Assumes consistent naming conventions are used for the columns
     * @param baseWorld
     * @param type
     * @param namingFormat
     * @returns
     */
    public static getKeys = <T>(
        baseWorld: JestBaseWorld | CucumberBaseWorld,
        type: new () => T,
        desiredFormat: FormatType
    ): (keyof T)[] => {
        const keys: (keyof T)[] = [];
        const connection = baseWorld.getConnection();

        const columns = connection
            .getMetadata(type)
            .columns.map(({ propertyName }) => propertyName);

        // assume consistent naming conventions used
        const formatType = checkType(columns[0]);

        for (const col of columns) {
            let columnName = "";
            if (col === "id") {
                columnName = col;
            } else if (/_id$/.test(col)) {
                columnName = col;
            }

            if (columnName !== "") {
                if (formatType !== desiredFormat) {
                    columnName = formatter(
                        formatType,
                        columnName,
                        desiredFormat
                    );
                }
                keys.push(columnName as keyof T);
            }
        }

        return keys;
    };

    //#endregion

    //#region Get Criteria
    private static getCriteria = <T>(
        baseWorld: JestBaseWorld | CucumberBaseWorld,
        type: new () => T
    ): Map<keyof T, T[keyof T]> => {
        const modelName = pascalToCamel(type.name);

        const keys = ModelActions.getKeys(baseWorld, type, "camelCase");
        const model = baseWorld.getCustomProp<T>(modelName);
        const criteria: Map<keyof T, T[keyof T]> = new Map<
            keyof T,
            T[keyof T]
        >();

        for (const key of keys) {
            if (
                model[key as keyof T] &&
                typeof model[key as keyof T] === "number"
            ) {
                if (Number(key) !== -1) {
                    (criteria as unknown as T)[key as keyof T] = model[key];
                }
            }
        }

        return criteria;
    };

    //#endregion

    //#region Create

    /**
     * @template T TypeORM entity class
     * @template X interface that T implements
     * @param baseWorld
     * @param type
     * @returns {Promise<T>}
     */
    static create = async <T, X>(
        baseWorld: JestBaseWorld | CucumberBaseWorld,
        type: new (options?: X) => T
    ): Promise<T> => {
        const modelName = pascalToCamel(type.name);

        const connection = baseWorld.getConnection();
        const attributes = baseWorld.getCustomProp<X>(`${modelName}Attributes`);

        let model = connection.manager.create<T>(type, new type(attributes));

        // handle automatic creation
        if (model instanceof User) {
            await model.hashPassword(model.password);
        }

        const result = await connection.manager.insert<T>(type, model);

        if (result.identifiers.length !== 1) {
            const { length } = result.identifiers;
            throw new Error(
                `${length < 1 ? "No" : "Multiple"} entities inserted`
            );
        }

        // retrieve new model
        model = await connection.manager.findOneOrFail<T>(type, {
            where: result.identifiers[0],
        });

        baseWorld.setCustomProp<X>(`${modelName}Attributes`, {
            ...attributes,
            id: Object.keys(model).includes("id")
                ? ((model as T)["id" as keyof T] as T[keyof T])
                : undefined,
        });

        baseWorld.setCustomProp<T>(modelName, model);

        return model;
    };

    //#endregion

    //#region Update
    /**
     *
     * @template T TypeORM entity class
     * @template X interface that T implements
     * @param baseWorld
     * @param type
     * @param attributesToUpdate
     * @returns {Promise<T>}
     */
    static update = async <T extends X, X>(
        baseWorld: JestBaseWorld | CucumberBaseWorld,
        type: new () => T,
        attributesToUpdate: Partial<X>
    ): Promise<T> => {
        const modelName = pascalToCamel(type.name);
        // if it does not have a key of "id" then it is a concatenated key
        // baseWorld means baseWorld we will add anything ending in _id to the where caluse if baseWorld is the case
        // otherwise the where clause will just use the id
        const connection = baseWorld.getConnection();

        let model = baseWorld.getCustomProp<T>(modelName);

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
            .set(attributesToUpdate as unknown as QueryDeepPartialEntity<T>);

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

        if (!result.affected || result.affected < 1)
            throw new Error("No rows updated");
        else {
            // Set updated values in attributes
            const modelAttributesName = `${modelName}Attributes`;
            const modelAttributes =
                baseWorld.getCustomProp<X>(modelAttributesName);

            for (const [key, value] of Object.entries(attributesToUpdate)) {
                (modelAttributes as X)[key as keyof X] = value as X[keyof X];
            }

            baseWorld.setCustomProp<X>(modelAttributesName, modelAttributes);

            // retrieve updated model
            model = await connection.manager.findOneOrFail<T>(type, {
                // reuse where clause for update
                where: whereClause.map((val) => val.properties),
            });

            return model;
        }
    };

    //#endregion

    //#region Delete

    /**
     *
     * @template T TypeORM entity class
     * @param baseWorld
     * @param {new () => T} type the class instance
     */
    static delete = async <T>(
        baseWorld: JestBaseWorld | CucumberBaseWorld,
        type: new () => T
    ): Promise<void> => {
        const modelName = pascalToCamel(type.name);
        const connection = baseWorld.getConnection();

        const model = baseWorld.getCustomProp<T | undefined>(modelName);

        if (model !== undefined) {
            await connection.manager.delete<T>(type, {
                ...ModelActions.getCriteria(baseWorld, type),
            });

            baseWorld.setCustomProp<undefined>(modelName, undefined);
            baseWorld.setCustomProp<undefined>(
                `${modelName}Attributes`,
                undefined
            );
        }
    };

    //#endregion

    //#region Compare

    /**
     *
     * @template T TypeORM entity class type
     * @template X the interface T implements
     * @param {T} model the class instance
     * @param {X} attr the interface to compare against
     * @returns {boolean} whether the properties are the same
     */
    static compareModelToInterface = async <T extends X, X>(
        model: T,
        attr: X
    ): Promise<boolean> => {
        let matches = true;

        for (const key of Object.keys(attr)) {
            const modelVal = model[key as keyof T];
            const attrVal = attr[key as keyof X];

            if (key === "password" && model instanceof User) {
                if (await model.comparePassword(attrVal as unknown as string)) {
                    continue;
                }
            }

            if (typeof modelVal !== "function") {
                // Loose equals
                if ((modelVal as unknown) !== (attrVal as unknown)) {
                    // Handle Dates
                    if (
                        Object.prototype.toString.call(modelVal) ===
                        "[object Date]"
                    ) {
                        const d1 = new Date(
                            modelVal instanceof Date
                                ? (modelVal as Date)
                                : (modelVal as unknown as string)
                        );
                        const d2 = new Date(
                            attrVal instanceof Date
                                ? (attrVal as Date)
                                : (attrVal as unknown as string)
                        );

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

    //#endregion
}
