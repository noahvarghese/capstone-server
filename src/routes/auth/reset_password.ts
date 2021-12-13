import { Request, Response, Router } from "express";
import * as userService from "@services/data/user";
import * as membershipService from "@services/data/memberships";
import * as userValidator from "@services/data/user/validators";
import ServiceError, { dataServiceResponse } from "@util/errors/service";

const router = Router();

export const resetPassword = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        params: { token },
        body: { password, confirm_password },
    } = req;

    try {
        userValidator.resetPasswordValidator(token, password, confirm_password);
        const userId = await userService.resetPassword(token, password);

        const memberships = await membershipService.getAll(userId);

        req.session.business_ids = memberships.map((m) => m.id);
        req.session.user_id = userId;
        req.session.current_business_id =
            memberships.find((m) => m.default)?.id ?? NaN;

        res.sendStatus(200);
    } catch (e) {
        const { message, field, reason } = e as ServiceError;
        res.status(dataServiceResponse(reason)).json({ field, message });
    }
};

router.post("/:token", resetPassword);

export default router;
