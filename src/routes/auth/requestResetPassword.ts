import { Request, Response, Router } from "express";
import User from "../../models/user/user";
import Logs from "../../util/logs/logs";
import { sendMail } from "../../util/mail";
import { client } from "../../util/permalink";

const router = Router();

router.post("/", async (request: Request, response: Response) => {
    const { email } = request.body;
    const { SqlConnection: connection } = request;
    const users = await connection.manager.find(User, { where: { email } });

    if (users.length !== 1) {
        response.status(400).json({ message: `Invalid email ${email}.` });
        return;
    }

    const user = users[0];

    user.createToken();

    try {
        await connection.manager.save(User, user);

        const resetPasswordUrl = client + "auth/resetPassword/" + user.token;

        await sendMail(user, {
            subject: "Reset Password Requested",
            html: `<div><h1>Reset password requested for user ${
                user.first_name + " " + user.last_name
            } : ${
                user.email
            }</h1><div>To reset your email please go to <a href="${resetPasswordUrl}">${resetPasswordUrl}</a></div><div>This link will expire at ${
                user.token_expiry
            }</div><div><sub><em>Please do not reply to this email. It will not reach the intended recipient. If there are any issues please email <a href="mailto:varghese.noah@gmail.com">Noah Varghese</a></em></sub></div></div>`,
        });
    } catch (e) {
        Logs.Error(e.message);
        response.sendStatus(500);
        return;
    }

    // Send password reset email

    response.sendStatus(200);
    return;
});

export default router;
