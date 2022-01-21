import { Request, Response } from "express";
import * as userService from "@services/data/user";
import * as membershipService from "@services/data/member";
import ServiceError, { dataServiceResponse } from "@util/errors/service";

export interface LoginProps {
    email: string;
    password: string;
}

const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as LoginProps;

    try {
        const userId = await userService.find(email, password);

        const memberships = await membershipService.get(userId);

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

export default login;
