import Permission from "@models/permission";
import Logs from "@util/logs/logs";
import { Request, Response, Router } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    const {
        SqlConnection: connection,
        session: { user_id, current_business_id },
    } = req;

    try {
        const permissions = await Permission.getAllForUserAndBusiness(
            Number(user_id),
            Number(current_business_id),
            connection
        );

        res.status(200).json({ data: permissions });
        return;
    } catch ({ message }) {
        Logs.Error(message);
        res.sendStatus(400);
        return;
    }
});

export default router;
