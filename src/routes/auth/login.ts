import { Request, Response, Router } from "express";
import * as userService from "@services/data/user";
import * as membershipService from "@services/data/memberships";
import ServiceError, { dataServiceResponse } from "@util/errors/service";

const router = Router();

export interface LoginProps {
    email: string;
    password: string;
}

router.post("/", async (req: Request, res: Response) => {
    const {
        SqlConnection,
        body: { email, password },
    } = req;

    try {
        const userId = await userService.findByLogin(
            SqlConnection,
            email,
            password
        );

        const memberships = await membershipService.getAll(
            SqlConnection,
            userId
        );

        if (memberships.length === 0) {
            res.status(400).json({ message: "Please contact your manager" });
            return;
        }

        req.session.user_id = userId;
        req.session.business_ids = memberships.map((m) => m.id);
        req.session.current_business_id =
            memberships.find((m) => m.default)?.id ?? NaN;

        res.sendStatus(200);
    } catch (e) {
        const { message, reason, field } = e as ServiceError;
        res.status(dataServiceResponse(reason)).json({ message, field });
    }
});

export default router;
