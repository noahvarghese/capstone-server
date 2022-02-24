import QuizQuestionType from "@models/quiz/question/question_type";
import { Request, Response } from "express";

const getController = async (req: Request, res: Response): Promise<void> => {
    const {
        params: { id },
        dbConnection,
    } = req;
    const qt = await dbConnection.manager.findOne(QuizQuestionType, id);
    res.status(200).send(qt);
};

export default getController;
