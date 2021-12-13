import { Request, Response, Router } from "express";
import * as userService from "@services/data/user";
import * as userValidator from "@services/data/user/validators";
import ServiceError, { dataServiceResponse } from "@util/errors/service";

const router = Router();

export const register = async (req: Request, res: Response): Promise<void> => {
    const { body } = req;

    try {
        await userValidator.registerAdminValidator(body);
        const { business_id, user_id } = await userService.registerAdmin(body);

        req.session.business_ids = [business_id];
        req.session.user_id = user_id;
        req.session.current_business_id = business_id;

        res.sendStatus(201);
        return;
    } catch (e) {
        const { message, reason, field } = e as ServiceError;
        res.status(dataServiceResponse(reason)).json({ message, field });
        return;
    }
};

router.post("/", register);

export default router;
