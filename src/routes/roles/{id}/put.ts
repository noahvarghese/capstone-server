import Logs from "@noahvarghese/logger";
import { Request, Response } from "express";

const putController = async (req: Request, res: Response): Promise<void> => {
    Logs.Debug(req);
    res.sendStatus(200);
    return;
};

export default putController;
