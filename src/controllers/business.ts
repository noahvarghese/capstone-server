import { Request, Response } from "express";
import * as membershipService from "@services/data/member";

export const getAll = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id },
    } = req;

    res.status(200).json(await membershipService.get(Number(user_id)));
};
