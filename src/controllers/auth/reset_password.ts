import { Request, Response } from "express";
import * as membershipService from "@services/data/member";
import * as userService from "@services/data/user";
import ServiceError, {
    dataServiceResponse,
    ServiceErrorReasons,
} from "@util/errors/service";

const resetPasswordValidator = (
    token: string,
    password: string,
    confirmPassword: string
): void => {
    if (!token)
        throw new ServiceError(
            "No token provided",
            ServiceErrorReasons.NOT_AUTHENTICATED
        );
    if (password !== confirmPassword)
        throw new ServiceError(
            "Passwords do not match",
            ServiceErrorReasons.PARAMETERS_MISSING
        );
};

const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const {
        params: { token },
        body: { password, confirm_password },
    } = req;

    try {
        resetPasswordValidator(token, password, confirm_password);
        const userId = await userService.password.reset(token, password);

        const memberships = await membershipService.get(userId);

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

export default resetPassword;
