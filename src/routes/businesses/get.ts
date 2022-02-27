import Business from "@models/business";
import Membership from "@models/membership";
import { Request, Response } from "express";

export const getBusinessController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        dbConnection,
        session: { user_id },
    } = req;

    const result = await dbConnection
        .createQueryBuilder()
        .select("b.id, b.name, m.default_option")
        .from(Membership, "m")
        .where("m.user_id = :user_id", { user_id: Number(user_id) })
        .andWhere("m.accepted = :accepted", { accepted: true })
        .leftJoin(Business, "b", "b.id = m.business_id")
        .orderBy("m.created_on", "DESC")
        .getRawMany<{ id: number; name: string; default_option: 1 | 0 }>();

    res.status(200).send(
        result.map(({ id, name, default_option }) => ({
            id,
            name,
            default: default_option === 1,
        }))
    );
};
