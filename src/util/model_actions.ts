import { Connection, DeepPartial, ObjectLiteral } from "typeorm";
import Logs from "./logs/logs";

export default class ModelActions {
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
        } catch (e) {
            Logs.Error(e.message);
            throw new Error(`An error occurred creating the ${type.name}`);
        }
    };
}
