import { Request, Response, Router } from "express";
import User from "@models/user/user";
import Logs from "@util/logs/logs";
import { resetPasswordEmail } from "@util/mail";
import { MoreThan } from "typeorm";

const router = Router();

router.post("/:token", async (request: Request, response: Response) => {
    const { SqlConnection: connection } = request;
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

    const users = await connection.manager.find(User, {
        where: { token, token_expiry: MoreThan(new Date()) },
    });

    if (users.length !== 1 || !users[0].compareToken(token)) {
        response.status(401).json({ message: "Invalid token." });
        return;
    }

    const user = users[0];

    if (await user.resetPassword(password, token)) {
        await connection.manager.save(User, user);
    } else {
        response.status(403).json({ message: "Password not long enough" });
        return;
    }

    try {
        await resetPasswordEmail(user);
        response.sendStatus(200);
        return;
    } catch (e) {
        Logs.Error(e.message);
        response.sendStatus(500);
        return;
    }
});

export default router;
