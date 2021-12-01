import { Request, Response, Router } from "express";
import { emptyChecker, isPhone } from "@util/validators";
import validator from "validator";
import Model from "@util/model";
import User from "@models/user/user";
import MembershipRequest from "@models/membership_request";
import { sendUserInviteEmail } from "@services/email";
import Business from "@models/business";
import Logs from "@util/logs/logs";
import { MoreThan } from "typeorm";
import Membership from "@models/membership";
import Permission from "@models/permission";

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

router.post("/", async (req: Request, res: Response) => {
    const { first_name, last_name, email, phone } =
        req.body as InviteMemberProps;
    const {
        session: { current_business_id, user_id },
    } = req;
    const { SqlConnection: connection } = req;

    //check permissions
    const hasPermission = await Permission.checkPermission(
        Number(user_id),
        Number(current_business_id),
        connection,
        ["global_crud_users"]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    // validate
    const result = emptyChecker<InviteMemberProps>(
        Object.assign(emptyInviteUser(), req.body)
    );

    if (result) {
        res.status(400).json(result);
        return;
    }

    if (validator.isEmail(email) === false) {
        res.status(400).json({ message: "Invalid email.", field: "email" });
        return;
    }

    if (!isPhone(phone)) {
        res.status(400).json({
            message: "Invalid phone number",
            field: "phone",
        });
        return;
    }

    // create records
    let userId: number;

    // handle user creation
    let invitedUser: User;

    // finds user, else creates user
    try {
        invitedUser = await connection.manager.findOneOrFail(User, {
            where: { email },
        });
    } catch (e) {
        try {
            userId = (
                await Model.create<User>(
                    connection,
                    User,
                    new User({ first_name, last_name, email, phone })
                )
            ).id;

            invitedUser = await connection.manager.findOneOrFail(User, userId);
        } catch (_e) {
            const e = _e as Error;
            Logs.Error(e.message);
            res.status(500).json({ message: e.message });
            return;
        }
    }

    try {
        const existingMembership = await connection.manager.find(Membership, {
            where: {
                user_id: invitedUser.id,
                business_id: current_business_id,
            },
        });
        if (existingMembership.length > 0) {
            res.status(400).json({
                message: "User is already a member of the business",
            });
            return;
        }
    } catch (_) {
        res.status(500).json({
            message: "Error checking if membership exists",
        });
        return;
    }

    const businessId = req.session.current_business_id;

    let membershipRequest: MembershipRequest;

    try {
        membershipRequest = await connection.manager.findOneOrFail(
            MembershipRequest,
            {
                where: { business_id: businessId, user_id: invitedUser.id },
            }
        );

        // update token and expiry
        membershipRequest.generateToken();
        const updateResult = await connection.manager.update(
            MembershipRequest,
            {
                user_id: membershipRequest.user_id,
                business_id: membershipRequest.business_id,
            },
            membershipRequest
        );

        if (!updateResult.affected || updateResult.affected < 1) {
            res.status(500).json({
                message: "Unable to update membership request",
            });
            return;
        } else if (updateResult.affected > 1) {
            res.status(500).json({
                message: "Updated multiple membership requests",
            });
            return;
        }
    } catch (_e) {
        membershipRequest = new MembershipRequest({
            user_id: invitedUser.id,
            business_id: businessId,
            updated_by_user_id: req.session.user_id,
        });

        try {
            await Model.create<MembershipRequest>(
                connection,
                MembershipRequest,
                membershipRequest
            );
        } catch (_e) {
            const e = _e as Error;
            Logs.Error(e.message);
            res.status(500).json({
                message: "Unable to create membership request",
            });
            return;
        }
    }

    // send notification
    const sendingUser = await connection.manager.findOneOrFail(
        User,
        req.session.user_id
    );

    const business = await connection.manager.findOneOrFail(
        Business,
        businessId
    );

    try {
        if (
            await sendUserInviteEmail(
                business,
                membershipRequest,
                sendingUser,
                invitedUser
            )
        ) {
            res.sendStatus(200);
            return;
        }
    } catch (_e) {
        const e = _e as Error;
        Logs.Error(e.message);
    }

    res.status(500).json({
        message: "failed to send invite, but user is registered",
    });
});

router.post("/:token", async (req: Request, res: Response) => {
    const { token } = req.params;
    const { SqlConnection: connection } = req;

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
                default: setDefault,
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
        const user = await connection.manager.findOneOrFail(User, {
            where: { id: membershipRequest.user_id },
        });

        if (!user.password) {
            await connection.manager.update(
                User,
                { email: user.email },
                { token: user.createToken().token }
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
