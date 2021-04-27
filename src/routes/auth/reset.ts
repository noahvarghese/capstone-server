import { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import User from "../../models/user/user";

const router = Router();

router.post("/reset", async (request: Request, response: Response) => {
    const { email } = request.body;
    const user = new User({ email });
    if (await user.createToken()) {
        // await user.connection.close();
        response.sendStatus(200);
        return;
    }

    // await user.connection.close();
    response.sendStatus(400);
    return;
});

router.post("/reset/:token", async (request: Request, response: Response) => {
    const { token } = request.params;
    const { password, confirmPassword } = request.body;

    if (password === confirmPassword) {
        const hashed_password = bcrypt.hashSync(password, 12);

        const user = new User({ token });
        if (await user.resetPassword(hashed_password)) {
            await passwordSuccesfullyReset(user);
            response.sendStatus(200);
            // await user.connection.close();
            return;
        }
        // await user.connection.close();
    }
    response.sendStatus(400);
    return;
});

export default router;
