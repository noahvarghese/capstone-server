import { Request, Response, Router } from "express";
import User from "../../models/user/user";
import Logs from "../../util/logs/logs";
import { requestResetPasswordEmail } from "../../util/mail";

const router = Router();

router.post("/", async (request: Request, response: Response) => {
    const { email } = request.body;
    const { SqlConnection: connection } = request;
    const users = await connection.manager.find(User, { where: { email } });

    if (users.length !== 1) {
        response.status(401).json({ message: `Invalid email ${email}.` });
        return;
    }

    const user = users[0];

    user.createToken();

    try {
        await connection.manager.save(User, user);
        await requestResetPasswordEmail(user);
        response.sendStatus(200);
    } catch (e) {
        Logs.Error(e.message);
        response.status(500).json({ message: "Unable to send email" });
    }
});

export default router;
