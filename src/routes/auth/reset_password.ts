import { Request, Response, Router } from "express";
import User from "../../models/user/user";
import Logs from "../../util/logs/logs";
import { resetPasswordEmail } from "../../util/mail";

const router = Router();

router.post("/:token", async (request: Request, response: Response) => {
    const { SqlConnection: connection } = request;
    const { token } = request.params;
    const { password, confirmPassword } = request.body;

    if (password !== confirmPassword || !token) {
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

        if (await user.resetPassword(password, token)) {
            await connection.manager.save(User, user);
            await resetPasswordEmail(user);
            response.sendStatus(200);
        } else {
            response.sendStatus(400);
        }
    } catch (e) {
        console.log(e.message);
        Logs.Error(e.message);
        response.sendStatus(500);
    }
});

export default router;