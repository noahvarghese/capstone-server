import Business from "@models/business";
import Membership from "@models/membership";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    const {
        dbConnection: connection,
        session: { user_id },
    } = req;

    const memberships = await connection.manager.find(Membership, {
        where: { user_id },
        order: { created_on: "ASC" },
    });

    const businesses = await connection.manager.find(Business, {
        where: memberships.map((m) => ({
            id: m.business_id,
        })) as {
            id: number;
        }[],
    });

    try {
        const returnVal = businesses.map((b) => {
            const m = memberships.find((m) => m.business_id === b.id);

            if (!m) {
                throw new Error("Can't find corresponding membership");
            }

            return {
                id: b.id,
                name: b.name,
                default_option: m.default_option,
            };
        });

        res.status(200).json({
            data: returnVal,
        });
    } catch (_e) {
        const { message } = _e as Error;
        res.status(500).json({ message });
    }
});

export default router;
