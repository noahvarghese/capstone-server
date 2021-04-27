import { createConnection, ConnectionOptions, Connection } from "typeorm";
import Business from "../models/business";
import Department from "../models/department";
import Permission from "../models/permission";
import Role from "../models/role";
import Content from "../models/manual/content";
import Manual from "../models/manual/manual";
import Policy from "../models/manual/policy";
import Section from "../models/manual/section";
import ManualAssignment from "../models/manual/manual_assignment";
import User from "../models/user/user";
import UserRole from "../models/user/user_role";
import DBLogger from "../util/logs/db_logger";
import Quiz from "../models/quiz/quiz";
import QuizSection from "../models/quiz/section";
import Question from "../models/quiz/question";
import Answer from "../models/quiz/answer";
import Attempt from "../models/quiz/attempt";

const connection: ConnectionOptions = {
    database: process.env.DB ?? "",
    host: process.env.DB_URL ?? "",
    username: process.env.DB_USER ?? "",
    password: process.env.DB_PWD ?? "",
    // enforce strict typing by only applying
    // a small subset of the potential database types
    type: (process.env.DB_TYPE as "mysql" | "postgres") ?? "",
    entities: [
        Business,
        User,
        Department,
        Permission,
        Role,
        UserRole,
        Manual,
        ManualAssignment,
        Section,
        Policy,
        Content,
        Quiz,
        QuizSection,
        Question,
        Answer,
        Attempt,
    ],
    logging: true,
    logger: new DBLogger(),
};

export default async (): Promise<Connection> =>
    await createConnection(connection);
