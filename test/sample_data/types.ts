import Business from "../../src/models/business";
import Department from "../../src/models/department";
import Content from "../../src/models/manual/content";
import Manual from "../../src/models/manual/manual";
import ManualSection from "../../src/models/manual/section";
import Policy from "../../src/models/manual/policy/policy";
import PolicyRead from "../../src/models/manual/policy/read";
import Permission from "../../src/models/permission";
import Quiz from "../../src/models/quiz/quiz";
import QuizSection from "../../src/models/quiz/section";
import Role from "../../src/models/role";
import User from "../../src/models/user/user";
import UserRole from "../../src/models/user/user_role";
import QuizQuestion from "../../src/models/quiz/question/question";
import QuizAnswer from "../../src/models/quiz/question/answer";
import QuizResult from "../../src/models/quiz/result";
import QuizAttempt from "../../src/models/quiz/attempt";
import Event from "../../src/models/event";
import ManualAssignment from "../../src/models/manual/assignment";
import Membership from "../../src/models/membership";
import MembershipRequest from "../../src/models/membership_request";

const types: { [i: string]: new () => unknown } = {
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
