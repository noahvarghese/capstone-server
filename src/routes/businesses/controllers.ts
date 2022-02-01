import DataServiceError from "@util/errors/service";
import { Request, Response } from "express";
import { getBusinessHandler } from "./handlers";

export const getBusinessController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        dbConnection: connection,
        session: { user_id },
    } = req;

    if (!user_id) {
        res.status(401).send("Not authenticated");
        return;
    }

    try {
        const businesses = await getBusinessHandler(connection, user_id);
        res.status(200).send(businesses);
    } catch (_e) {
        const { code, message } = _e as DataServiceError;
        res.status(code).send(message);
        return;
    }
};
