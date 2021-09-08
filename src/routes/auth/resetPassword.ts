import { Request, Response, Router } from "express";
import User from "../../models/user/user";
import Logs from "../../util/logs/logs";
import { sendMail } from "../../util/mail";

const router = Router();

router.post("/:token", async (request: Request, response: Response) => {
    const { SqlConnection: connection } = request;
    const { token } = request.params;
    const { password, confirmPassword } = request.body;

    if (password !== confirmPassword) {
        response.sendStatus(400);
        return;
    }

    try {
        const users = await connection.manager.find(User, { where: { token } });

        if (users.length !== 1) {
            response.status(400).json({ message: "Invalid token." });
            return;
        }

        const user = users[0];
        await user.hashPassword(password);

        await connection.manager.save(User, user);

        // send password succesfully reset email

        await sendMail(user, {
            subject: "Reset Password Requested",
            html: `<div><h1>Reset password successful for ${
                user.first_name + " " + user.last_name
            } : ${
                user.email
            }</h1><div>Your password has been reset, please contact support if this was not you.</div><div><sub><em>Please do not reply to this email. It will not reach the intended recipient. If there are any issues please email <a href="mailto:varghese.noah@gmail.com">Noah Varghese</a></em></sub></div></div>`,
        });

        response.sendStatus(200);
        return;
    } catch (e) {
        Logs.Error(e.message);
        response.sendStatus(500);
        return;
    }
});

export default router;
