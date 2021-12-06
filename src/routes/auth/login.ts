import { Request, Response, Router } from "express";
import * as userService from "@services/data/user";
import ServiceError from "@util/errors/service_error";

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

        const memberships = await userService.getMemberships(
            SqlConnection,
            userId
        );

        req.session.user_id = userId;
        req.session.business_ids = memberships.map((m) => m.id);
        req.session.current_business_id =
            memberships.find((m) => m.default)?.id ?? NaN;

        res.sendStatus(200);
    } catch (e) {
        const { message, reason } = e as ServiceError;
        res.status(reason).json({ message });
    }
});

export default router;
