import Business from "@models/business";
import Membership from "@models/membership";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import Logs from "@util/logs/logs";
import { Connection } from "typeorm";

export const getBusinessHandler = async (
    connection: Connection,
    user_id: number
): Promise<{ id: number; name: string; default: boolean }[]> => {
    try {
        const res = await connection
            .createQueryBuilder()
            .select("b.id, b.name, m.default")
            .from(Membership, "m")
            .where("m.user_id = :user_id", { user_id })
            .leftJoin(Business, "b", "b.id = m.business_id")
            .orderBy("m.created_on", "DESC")
            .getRawMany<{ id: number; name: string; default_option: 1 | 0 }>();

        return res.map(({ id, name, default_option }) => ({
            id,
            name,
            default: default_option === 1,
        }));
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            ServiceErrorReasons.DATABASE,
            "Failed to retrieve businesses"
        );
    }
};
