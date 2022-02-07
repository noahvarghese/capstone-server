import { Request, Response, Router } from "express";
import User from "@models/user/user";
import MembershipRequest from "@models/membership_request";
import { MoreThan } from "typeorm";
import Membership from "@models/membership";
import { uid } from "rand-token";
import Logs from "@noahvarghese/logger";

export interface InviteMemberProps {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
}

export const emptyInviteUser = (): InviteMemberProps => ({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
});

const router = Router();

router.post("/:token", async (req: Request, res: Response) => {
    const { token } = req.params;
    const { dbConnection: connection } = req;

    let membershipRequest: MembershipRequest;

    try {
        membershipRequest = await connection.manager.findOneOrFail(
            MembershipRequest,
            { where: { token, token_expiry: MoreThan(new Date()) } }
        );
    } catch (_e) {
        const e = _e as Error;
        Logs.Debug(e.message);
        res.status(400).json({
            message:
                "No invitation found, please ask your manager for another invite.",
        });
        return;
    }

    // check if there is another membership request
    let setDefault;

    try {
        const count = await connection.manager.count(Membership, {
            where: { user_id: membershipRequest.user_id },
        });

        if (count === 0) setDefault = true;
    } catch (_) {
        setDefault = false;
    }

    try {
        await connection.manager.insert(
            Membership,
            new Membership({
                business_id: membershipRequest.business_id,
                updated_by_user_id: membershipRequest.user_id,
                user_id: membershipRequest.user_id,
                default_option: setDefault,
            })
        );
    } catch (_e) {
        const e = _e as Error;
        Logs.Debug(e.message);
        res.status(400).json({
            message: "User is already a member of the business",
        });
        return;
    }

    try {
        await connection.manager.delete(MembershipRequest, membershipRequest);
    } catch (e) {
        const { message } = e as Error;
        Logs.Error(message);
        res.status(500).json({
            message: "Unable to delete membership request",
        });
        return;
    }

    try {
        const user = await connection.manager.findOneOrFail(User, {
            where: { id: membershipRequest.user_id },
        });

        if (!user.password) {
            await connection.manager.update(
                User,
                { email: user.email },
                { token: uid(32) }
            );
        }
    } catch (_e) {
        const e = _e as Error;
        Logs.Debug(e.message);
        res.status(400).json({
            message: "Could not find user",
        });
        return;
    }

    res.sendStatus(200);
    return;
});
export default router;
