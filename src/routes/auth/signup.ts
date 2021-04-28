import { Request, Response, Router } from "express";
import validator from "validator";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    if (req.session && req.session.user_id && req.session.business_id) {
        const {
            first_name,
            last_name,
            email,
            phone: originalPhone,
            address,
            city,
            postal_code,
            province,
            country,
            birthday,
            password,
        } = req.body;

        if (validator.isEmail(email) === false) {
            res.status(400).json({ message: "Invalid email." });
            return;
        }

        if (validator.isDate(birthday) === false) {
            res.status(400).json({ message: "Invalid birthday" });
            return;
        }
    }
});

export default router;
