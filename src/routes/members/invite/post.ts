import MembershipRequest from "@models/membership_request";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import Logs from "@noahvarghese/logger";
import { sendUserInviteEmail } from "@services/email";
import { bodyValidators } from "@util/formats/body";
import { Request, Response } from "express";

export const sendInviteController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        session: { current_business_id, user_id },
        dbConnection,
    } = req;

    // despite checking in the middleware, we need to explicitly define these as numbers
    if (!user_id || !current_business_id) {
        res.sendStatus(401);
        return;
    }

    let email = "",
        phone = "";

    try {
        const data = getJOpts(
            req.body,
            {
                email: { type: "string", required: true, format: "email" },
                phone: { type: "string", required: false, format: "phone" },
            },
            bodyValidators
        );
        email = data.email as string;
        phone = data.phone as string;
    } catch (_e) {
        const { message } = _e as Error;
        res.status(400).send(message);
        return;
    }

    try {
        const hasPermissions = await User.hasGlobalPermission(
            dbConnection,
            user_id,
            current_business_id,
            ["global_crud_users"]
        );

        if (!hasPermissions) {
            res.sendStatus(403);
            return;
        }
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
        return;
    }

    let invitedUserId = (
        await dbConnection.manager.findOne(User, {
            where: { email: email },
        })
    )?.id;

    if (!invitedUserId) {
        ({
            identifiers: [{ id: invitedUserId }],
        } = await dbConnection.manager.insert(
            User,
            new User({ email, phone })
        ));
    }

    await dbConnection.manager.save(
        MembershipRequest,
        new MembershipRequest({
            user_id: invitedUserId,
            business_id: current_business_id,
            updated_by_user_id: user_id,
        })
    );

    try {
        if (
            await sendUserInviteEmail(
                dbConnection,
                current_business_id,
                user_id,
                invitedUserId ?? NaN
            )
        ) {
            res.sendStatus(201);
        } else {
            res.sendStatus(500);
        }
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
    }
};
