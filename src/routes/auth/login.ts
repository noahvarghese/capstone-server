import { Request, Response, Router } from "express";
import * as userService from "@services/data/user";
import * as membershipService from "@services/data/memberships";
import ServiceError, { dataServiceResponse } from "@util/errors/service";

const router = Router();

export interface LoginProps {
    email: string;
    password: string;
}

export const login = async (req: Request, res: Response): Promise<void> => {
    const {
        body: { email, password },
    } = req;

    try {
        const userId = await userService.findByLogin(email, password);

        const memberships = await membershipService.getAll(userId);

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
};

router.post("/", login);

export default router;
