import DataServiceError from "@util/errors/service";
import { isPhone, isPostalCode } from "@util/validators";
import { Request, Response } from "express";
import validator from "validator";
import { loginHandler } from "../login/handler";
import { registerHandler } from "./handler";

export const registerController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { body, dbConnection } = req;

    let field = "";

    if (!validator.isEmail(body.email ?? "")) field = "email";
    else if (!validator.isEmpty(body.phone ?? "") && !isPhone(body.phone))
        field = "phone";
    else if (validator.isEmpty(body.name ?? "", { ignore_whitespace: true }))
        field = "name";
    else if (
        validator.isEmpty(body.first_name ?? "", { ignore_whitespace: true })
    )
        field = "first name";
    else if (
        validator.isEmpty(body.last_name ?? "", { ignore_whitespace: true })
    )
        field = "last name";
    else if (validator.isEmpty(body.address ?? "", { ignore_whitespace: true }))
        field = "address";
    else if (validator.isEmpty(body.city ?? "", { ignore_whitespace: true }))
        field = "city";
    else if (isPostalCode(body.postal_code ?? "")) field = "postal_code";
    else if (
        validator.isEmpty(body.province ?? "", { ignore_whitespace: true }) ||
        body.province.length > 2
    )
        field = "province";
    else if (
        validator.isEmpty(body.password ?? "", { ignore_whitespace: true })
    )
        field = "password";
    else if (
        validator.isEmpty(body.confirm_password ?? "", {
            ignore_whitespace: true,
        })
    )
        field = "confirm password";
    else if (body.confirm_password !== body.password)
        field = "confirm password doesn't match password";

    if (field !== "") {
        res.status(400).send(`Invalid field ${field}`);
        return;
    }

    try {
        await registerHandler(dbConnection, body);

        const { user_id, business_ids, current_business_id } =
            await loginHandler(dbConnection, body.email, body.password);

        req.session.business_ids = business_ids;
        req.session.current_business_id = current_business_id;
        req.session.user_id = user_id;

        res.sendStatus(201);
    } catch (_e) {
        const { code, message } = _e as DataServiceError;
        res.status(code).send(message);
    }
};
