import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    Logs.Debug(req);
    res.status(200).send([]);
    return;
};

export default getController;
