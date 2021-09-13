import { Request, Response, Router } from "express";
import User from "../../models/user/user";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    const { SqlConnection: connection } = req;

    const { email, password } = req.body;

    const users = await connection.manager.find(User, {
        where: { email },
    });

    if (users.length !== 1) {
        res.status(400).json({ message: `Invalid login ${email}.` });
        return;
    }

    const user = users[0];

    if (user.password) {
        const success = await user.comparePassword(password);
        if (success) {
            req.session.user_id = user.id;
            res.sendStatus(200);
            return;
        }
    }

    res.sendStatus(401);
    return;
});

export default router;
