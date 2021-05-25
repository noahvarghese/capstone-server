import { Request, Response, Router } from "express";
import User from "../../models/user/user";
import { UpdateResult } from "typeorm";

const router = Router();

router.post("/", async (request: Request, response: Response) => {
    const { email } = request.body;
    const { SqlConnection: connection } = request;
    const users = await connection.manager.find(User, { where: { email } });

    if (users.length !== 1) {
        response.status(400).json({ message: "Invalid email." });
        return;
    }

    const user = users[0];

    user.createToken();

    const result: UpdateResult = await connection.manager.update(
        User,
        user.id,
        user
    );

    if (result.affected !== 1) {
        response.sendStatus(500);
        return;
    }

    // Send password reset email

    response.sendStatus(200);
    return;
});

export default router;
