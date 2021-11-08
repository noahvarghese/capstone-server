import { Request, Response, Router } from "express";
import User from "@models/user/user";
import Logs from "@util/logs/logs";
import { requestResetPasswordEmail } from "@services/email";

const router = Router();

router.post("/", async (request: Request, response: Response) => {
    const { email } = request.body;
    const { SqlConnection: connection } = request;
    const users = await connection.manager.find(User, { where: { email } });

    if (users.length === 0) {
        response.status(401).json({ message: `Invalid email ${email}.` });
        return;
    } else if (users.length > 1) {
        response.status(500).json({ message: `Multiple records returned` });
        return;
    }

    const user = users[0];

    user.createToken();

    try {
        await connection.manager.update(
            User,
            { email: user.email },
            { token: user.token }
        );
    } catch (e) {
        Logs.Error(e);
        response.status(500).json({ message: "Unable to complete request" });
        return;
    }

    try {
        await requestResetPasswordEmail(user);
        response.sendStatus(200);
    } catch (_e) {
        const e = _e as Error;
        Logs.Error(e.message);
        response.status(500).json({ message: "Unable to send email" });
    }
});

export default router;
