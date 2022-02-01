import { Request, Response, Router } from "express";
import User from "@models/user/user";
import Logs from "@util/logs/logs";
import { resetPasswordEmail } from "@services/email";
import { MoreThan } from "typeorm";
import Membership from "@models/membership";

const router = Router();

router.post("/:token", async (request: Request, response: Response) => {
    const { dbConnection: connection } = request;
    const { token } = request.params;
    const { password, confirm_password } = request.body;

    if (!token) {
        response.status(400).json({ message: "No token provided" });
        return;
    }

    if (password !== confirm_password) {
        response.status(400).json({ message: "Passwords do not match" });
        return;
    }

    let user: User;

    try {
        user = await connection.manager.findOneOrFail(User, {
            where: {
                token,
                token_expiry: MoreThan(new Date()),
            },
        });
    } catch (_e) {
        const e = _e as Error;
        Logs.Error(e.message);
        response.status(401).json({ message: "Invalid token." });
        return;
    }

    if (await user.resetPassword(password, token)) {
        const { token, token_expiry, password } = user;
        await connection.manager.update(
            User,
            { id: user.id },
            { token, token_expiry, password }
        );
    } else {
        response.status(403).json({ message: "Password not long enough" });
        return;
    }

    try {
        await resetPasswordEmail(user);

        const memberships = await connection.manager.find(Membership, {
            where: { user_id: user.id },
            order: { created_on: "ASC" },
        });

        request.session.business_ids = memberships.map((m) => m.business_id);
        request.session.user_id = user.id;
        request.session.current_business_id = memberships.find(
            (m) => m.default_option
        )?.business_id;
        response.sendStatus(200);
        return;
    } catch (_e) {
        const e = _e as Error;
        Logs.Error(e.message);
        response.sendStatus(500);
        return;
    }
});

export default router;
