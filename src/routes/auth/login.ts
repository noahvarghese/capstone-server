import { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import User from "../../models/user/user";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    const { SqlConnection: connection } = req;

    const { email, password } = req.body;

    const users = await connection.manager.find(User, {
        where: { email },
    });

    if (users.length !== 1) {
        res.status(500).json({ message: "Invalid login." });
        return;
    }

    const user = users[0];

    if (user.password) {
        const match: boolean = await new Promise((res, rej) => {
            bcrypt.compare(password, user.password, (err, same) => {
                if (err) {
                    rej(err);
                }
                res(same);
            });
        });

        if (match) {
            req.session.user_id = user.id;
            res.status(202);
            return;
        }
    }

    res.status(401);
    return;
});

export default router;