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
import Event from "@models/event";
import Membership from "@models/membership";
import MembershipRequest from "@models/membership_request";
import PolicyRead from "@models/manual/policy/read";
import QuizAttempt from "@models/quiz/attempt";
import QuizAnswer from "@models/quiz/question/answer";
import QuizQuestion from "@models/quiz/question/question";
import QuizResult from "@models/quiz/result";

// This is the order they should be deleted by
export const entities = [
    Event,
    QuizResult,
    QuizAttempt,
    QuizAnswer,
    QuizQuestion,
    QuizSection,
    Quiz,
    Content,
    PolicyRead,
    Policy,
    ManualSection,
    ManualAssignment,
    Manual,
    UserRole,
    Role,
    Permission,
    Department,
    Membership,
    MembershipRequest,
    User,
    Business,
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
