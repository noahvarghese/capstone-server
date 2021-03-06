import Membership from "@models/membership";
import User from "@models/user/user";
import getJOpts from "@noahvarghese/get_j_opts";
import Logs from "@noahvarghese/logger";
import { sendUserInviteEmail } from "@services/email";
import { bodyValidators } from "@util/formats/body";
import { Request, Response } from "express";
import { uid } from "rand-token";

export const sendInviteController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        session: { current_business_id, user_id },
        dbConnection,
    } = req;

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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!(await User.isAdmin(dbConnection, current_business_id!, user_id!))) {
        res.sendStatus(403);
        return;
    }

    let invitedUserId = (
        await dbConnection.manager.findOne(User, {
            where: { email },
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

    const m = await dbConnection.manager.findOne(Membership, {
        where: { user_id: invitedUserId, business_id: current_business_id },
    });

    if (m && m.accepted) {
        res.sendStatus(400);
        return;
    }

    const token = uid(32);
    const token_expiry = new Date();
    token_expiry.setDate(token_expiry.getDate() + 1);

    await dbConnection.manager.save(
        Membership,
        new Membership({
            accepted: false,
            token,
            token_expiry,
            user_id: invitedUserId,
            business_id: current_business_id,
            updated_by_user_id: user_id,
        })
    );

    try {
        if (
            await sendUserInviteEmail(
                dbConnection,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                current_business_id!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                user_id!,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                invitedUserId!,
                token
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
