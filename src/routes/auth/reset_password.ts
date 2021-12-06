import { Request, Response, Router } from "express";
import * as userService from "@services/data/user";
import * as userValidator from "@services/data/user/validators";
import Logs from "@util/logs/logs";
import ServiceError from "@util/errors/service_error";

const router = Router();

router.post("/:token", async (req: Request, res: Response) => {
    const {
        SqlConnection,
        params: { token },
        body: { password, confirm_password },
    } = req;

    try {
        userValidator.resetPasswordValidator(token, password, confirm_password);
        const userId = await userService.resetPassword(
            SqlConnection,
            token,
            password
        );

        const memberships = await userService.getMemberships(
            SqlConnection,
            userId
        );

        req.session.business_ids = memberships.map((m) => m.id);
        req.session.user_id = userId;
        req.session.current_business_id =
            memberships.find((m) => m.default)?.id ?? NaN;

        res.sendStatus(200);
    } catch (e) {
        const { message, reason } = e as ServiceError;
        Logs.Debug(message);
        res.status(reason).json({ message });
    }
});

export default router;
