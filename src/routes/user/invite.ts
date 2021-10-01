import { Request, Response, Router } from "express";
import { emptyChecker, phoneValidator } from "@util/validators";
import validator from "validator";
import Model from "@util/model";
import User from "@models/user/user";
import MembershipRequest from "@models/membership_request";
import { sendUserInviteEmail } from "@util/mail";
import Business from "@models/business";

export interface InviteUserProps {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
}

export const emptyInviteUser = (): InviteUserProps => ({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
});

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    const { first_name, last_name, email, phone } = req.body as InviteUserProps;

    // validate
    const result = emptyChecker<InviteUserProps>(
        Object.assign(emptyInviteUser(), req.body)
    );

    if (result) res.status(400).json(result);

    if (validator.isEmail(email) === false) {
        res.status(400).json({ message: "Invalid email.", field: "email" });
        return;
    }

    if (!phoneValidator(phone)) {
        res.status(400).json({
            message: "Invalid phone number",
            field: "phone",
        });
        return;
    }

    // create records
    const { SqlConnection: connection } = req;
    let userId: number;

    try {
        userId = (
            await Model.create<User>(
                connection,
                User,
                new User({ first_name, last_name, email, phone })
            )
        ).id;
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }

    const businessId = req.session.current_business_id;
    const membershipRequest = new MembershipRequest({
        user_id: userId,
        business_id: businessId,
        updated_by_user_id: req.session.user_id,
    });

    try {
        await Model.create<MembershipRequest>(
            connection,
            MembershipRequest,
            membershipRequest
        );
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }

    // send notification
    const sendingUser = await connection.manager.findOneOrFail(
        User,
        req.session.user_id
    );

    const receivingUser = await connection.manager.findOneOrFail(User, userId);

    const business = await connection.manager.findOneOrFail(
        Business,
        businessId
    );

    if (
        await sendUserInviteEmail(
            business,
            membershipRequest,
            sendingUser,
            receivingUser
        )
    ) {
        res.sendStatus(200);
        return;
    }

    res.status(500).json({ message: "failed to send invite" });
});

export default router;
