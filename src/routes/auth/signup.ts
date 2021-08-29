import { Request, Response, Router } from "express";
import validator from "validator";
import { phoneValidator, postalCodeValidator } from "../../util/validators";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    console.log(req.body);
    return;
    const {
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        postal_code,
        province,
        birthday,
        business_code,
        password,
        confirm_password,
        business_name,
        business_address,
        business_city,
        business_postal_code,
        business_phone,
        business_email,
    } = req.body;

    // checks for empty entries
    for (const [key, value] of Object.entries(req.body)) {
        if (!value || (value as string).trim() === "") {
            res.status(400).json({
                message: `${
                    key[0].toUpperCase() + key.substring(1)
                } cannot be empty`,
                field: key,
            });
            return;
        }
    }

    if (validator.isEmail(email) === false) {
        res.status(400).json({ message: "Invalid email.", field: "email" });
        return;
    }

    if (validator.isDate(birthday) === false) {
        res.status(400).json({
            message: "Invalid birthday",
            field: "birthday",
        });
        return;
    }

    if (!phoneValidator(phone)) {
        res.status(400).json({
            message: "Invalid phone number",
            field: "phone",
        });
        return;
    }

    if (!postalCodeValidator(postal_code)) {
        res.status(400).json({
            message: "Invalid postal code",
            field: "postal_code",
        });
    }

    if (business_name) {
        // run business code validator
    } else {
        // create new business
    }

    // create new user
    // if new business user will be the foremost manager
});

export default router;
