import Business from "@models/business";
import Membership from "@models/membership";
import Logs from "@util/logs/logs";
import { Connection } from "typeorm";

export * from "./invite";

export type MemberResponse = { id: number; name: string; default: boolean };

/**
 * Gets list of businesses that the user is a part of
 * @param connection
 * @param user_id
 * @returns {MemberResponse[]}
 */
export const getMemberships = async (
    connection: Connection,
    user_id: number
): Promise<MemberResponse[]> => {
    try {
        const res = await connection
            .createQueryBuilder()
            .select("b.id, b.name, m.default")
            .from(Membership, "m")
            .where("m.user_id = :user_id", { user_id })
            .leftJoin(Business, "b", "b.id = m.business_id")
            .orderBy("m.created_on", "DESC")
            .getRawMany<{ id: number; name: string; default_option: 1 | 0 }>();

        return res.map((r) => ({
            id: r.id,
            name: r.name,
            default: r.default_option === 1,
        }));
    } catch (e) {
        const { message } = e as Error;
        Logs.Error(message);
        return [];
    }
};
