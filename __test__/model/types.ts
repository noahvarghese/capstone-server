import Business from "@models/business";
import Department from "@models/department";
import Content from "@models/manual/content/content";
import Manual from "@models/manual/manual";
import ManualSection from "@models/manual/section";
import Policy from "@models/manual/policy";
import PolicyRead from "@models/manual/content/read";
import Permission from "@models/permission";
import Quiz from "@models/quiz/quiz";
import QuizSection from "@models/quiz/section";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import QuizQuestion from "@models/quiz/question/question";
import QuizAnswer from "@models/quiz/question/answer";
import QuizResult from "@models/quiz/question/result";
import QuizAttempt from "@models/quiz/attempt";
import Event from "@models/event";
import ManualAssignment from "@models/manual/assignment";
import Membership from "@models/membership";
import MembershipRequest from "@models/membership_request";
import ModelTest from ".";

/**
 * Set of types so we can iterate over them in tests
 */
const types: { [i in ModelTest]: new () => unknown } = {
    business: Business,
    membership: Membership,
    membershipRequest: MembershipRequest,
    user: User,
    permission: Permission,
    department: Department,
    role: Role,
    userRole: UserRole,
    manual: Manual,
    manualAssignment: ManualAssignment,
    manualSection: ManualSection,
    policy: Policy,
    content: Content,
    policyRead: PolicyRead,
    quiz: Quiz,
    quizSection: QuizSection,
    quizQuestion: QuizQuestion,
    quizAnswer: QuizAnswer,
    quizAttempt: QuizAttempt,
    quizResult: QuizResult,
    event: Event,
};

export default types;
