import Logs from "@noahvarghese/logger";
import { Connection, DeepPartial, ObjectLiteral } from "typeorm";

export default class Model {
    public static create = async <T>(
        connection: Connection,
        type: new () => T,
        options: DeepPartial<T>
    ): Promise<ObjectLiteral> => {
        try {
            const result = await connection.manager.insert<T>(type, options);

            if (result.identifiers.length !== 1) {
                throw new Error(`An error occurred creating the ${type.name}`);
            }

            return result.identifiers[0];
        } catch (_e) {
            const e = _e as Error;
            Logs.Error(e.message);
            throw new Error(`An error occurred creating the ${type.name}`);
        }
    };
}
