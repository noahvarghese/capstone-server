import Business from "@models/business";
import Department from "@models/department";
import Event from "@models/event";
import ManualAssignment from "@models/manual/assignment";
import Content from "@models/manual/content/content";
import ContentRead from "@models/manual/content/read";
import Manual from "@models/manual/manual";
import Policy from "@models/manual/policy";
import ManualSection from "@models/manual/section";
import Membership from "@models/membership";
import QuizAttempt from "@models/quiz/attempt";
import QuizAnswer from "@models/quiz/question/answer";
import QuizQuestion from "@models/quiz/question/question";
import QuizResult from "@models/quiz/question/result";
import Quiz from "@models/quiz/quiz";
import QuizSection from "@models/quiz/section";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { Connection } from "typeorm";

const ALL = () => "";

/**
 * Not the most efficient, but literally cannot be bothered otherwise
 * @param conn
 */
export const unitTeardown = async (conn: Connection): Promise<void> => {
    await Promise.all([
        conn.manager.clear(Event),
        conn.manager.delete(ContentRead, ALL),
        conn.manager.delete(QuizResult, ALL),
        conn.manager.delete(ManualAssignment, ALL),
        conn.manager.delete(UserRole, ALL),
        conn.manager.delete(Membership, ALL),
    ]);
    await Promise.all([
        conn.manager.delete(QuizAttempt, ALL),
        conn.manager.delete(Content, ALL),
        conn.manager.delete(Role, ALL),
    ]);
    await Promise.all([
        conn.manager.delete(QuizAnswer, ALL),
        conn.manager.delete(Policy, ALL),
        conn.manager.delete(Department, ALL),
    ]);
    await Promise.all([
        conn.manager.delete(QuizQuestion, ALL),
        conn.manager.delete(ManualSection, ALL),
    ]);

    await conn.manager.delete(QuizSection, ALL);
    await conn.manager.delete(Quiz, ALL);
    await conn.manager.delete(Manual, ALL);

    await Promise.all([
        conn.manager.delete(User, ALL),
        conn.manager.delete(Business, ALL),
    ]);
};
