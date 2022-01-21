import { Request, Response } from "express";
import Nav from "@services/data/nav";

export const getNav = async (req: Request, res: Response): Promise<void> => {
    const {
        session: { user_id, current_business_id },
    } = req;

    const nav = new Nav(Number(current_business_id), Number(user_id));

    res.status(200).json(await nav.getLinks());
};
