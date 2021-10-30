import Membership from "@models/membership";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    const {
        SqlConnection: connection,
        session: { user_id },
    } = req;

    const memberships = await connection.manager.find(Membership, {
        where: { user_id },
        order: { created_on: "ASC" },
    });

    res.status(200).json({
        businesses: memberships.map((m) => ({
            id: m.business_id,
            default: m.default,
        })),
    });
});
export default router;
