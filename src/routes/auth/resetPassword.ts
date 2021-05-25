import { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import User from "../../models/user/user";

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
        const hashed_password: string = await new Promise((res, rej) => {
            bcrypt.hash(password, 12, (err, encrypted) => {
                if (err) {
                    rej(err);
                }
                res(encrypted);
            });
        });

        const users = await connection.manager.find(User, { where: { token } });

        if (users.length !== 1) {
            response.status(400).json({ message: "Invalid token." });
            return;
        }

        const user = users[0];
        user.password = hashed_password;

        const result = await connection.manager.update(User, user.id, user);

        if (result.affected !== 1) {
            response.sendStatus(500);
            return;
        }

        // send password succesfully reset email

        response.sendStatus(200);
        return;
    } catch (e) {
        response.sendStatus(500);
        return;
    }
});

export default router;
