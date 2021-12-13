import { Request, Response, Router } from "express";
import * as userService from "@services/data/user";
import * as userValidator from "@services/data/user/validators";
import Logs from "@util/logs/logs";
import ServiceError, { dataServiceResponse } from "@util/errors/service";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
    } = req;

    try {
        userValidator.sendInviteValidator(req.body);
        await userService.sendInvite(
            req.body,
            Number(current_business_id),
            Number(user_id)
        );
        res.sendStatus(200);
    } catch (e) {
        const { message } = e as Error;
        Logs.Error(message);
        res.status(400).json({ message });
    }
});

router.post("/:token", async (req: Request, res: Response) => {
    const {
        params: { token },
    } = req;

    try {
        await userService.acceptInvite(token);
        res.sendStatus(200);
        return;
    } catch (e) {
        const { message, field, reason } = e as ServiceError;
        Logs.Error(message);
        res.status(dataServiceResponse(reason)).json({
            field,
            message,
        });
        return;
    }
});
export default router;
