import DataServiceError from "@util/errors/service";
import { Request, Response } from "express";
import { getBusinessHandler } from "./get_handler";

export const getBusinessController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        dbConnection: connection,
        session: { user_id },
    } = req;

    try {
        const businesses = await getBusinessHandler(
            connection,
            // forced coersion as we check in the middleware
            Number(user_id)
        );
        res.status(200).send(businesses);
    } catch (_e) {
        const { code, message } = _e as DataServiceError;
        res.status(code).send(message);
        return;
    }
};
