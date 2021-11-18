import { createConnection, ConnectionOptions, Connection } from "typeorm";
import Business from "@models/business";
import Department from "@models/department";
import Permission from "@models/permission";
import Role from "@models/role";
import Content from "@models/manual/content";
import Manual from "@models/manual/manual";
import Policy from "@models/manual/policy/policy";
import ManualSection from "@models/manual/section";
import ManualAssignment from "@models/manual/assignment";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import DBLogger from "@util/logs/db_logger";
import Quiz from "@models/quiz/quiz";
import QuizSection from "@models/quiz/section";
import Question from "@models/quiz/question/question";
import Answer from "@models/quiz/question/answer";
import Attempt from "@models/quiz/attempt";
import Result from "@models/quiz/result";
import Read from "@models/manual/policy/read";
import Event from "@models/event";
import Membership from "@models/membership";
import MembershipRequest from "@models/membership_request";

const entities = [
    Business,
    User,
    MembershipRequest,
    Membership,
    Department,
    Permission,
    Role,
    UserRole,
    Manual,
    ManualAssignment,
    ManualSection,
    Policy,
    Content,
    Quiz,
    QuizSection,
    Question,
    Answer,
    Attempt,
    Result,
    Read,
    Event,
];

export const connectionOptions = (): ConnectionOptions => {
    let database = process.env.DB ?? "";

    if (typeof process.env.DB_ENV === "string") {
        if (process.env.DB_ENV.startsWith("_")) {
            database += process.env.DB_ENV;
        } else {
            database += `_${process.env.DB_ENV}`;
        }
    }

    return {
        database,
        host: process.env.DB_URL ?? "",
        username: process.env.DB_USER ?? "",
        password: process.env.DB_PWD ?? "",
        // enforce strict typing by only applying
        // a small subset of the potential database types
        type: (process.env.DB_TYPE as "mysql" | "postgres") ?? "",
        entities,
        logging: true,
        logger: new DBLogger(),
        extra: {
            connectionLimit: 3,
        },
    };
};

export default async (): Promise<Connection> => {
    const opts = connectionOptions();

    return await createConnection({
        ...opts,
    });
};
