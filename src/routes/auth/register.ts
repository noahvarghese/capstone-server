import { Request, Response, Router } from "express";
import * as userService from "@services/data/user";
import * as userValidator from "@services/data/user/validators";
import ServiceError, { dataServiceResponse } from "@util/errors/service";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    const { SqlConnection, body } = req;

    try {
        await userValidator.registerAdminValidator(SqlConnection, body);
        const { business_id, user_id } = await userService.registerAdmin(
            SqlConnection,
            body
        );

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
});

export default router;
