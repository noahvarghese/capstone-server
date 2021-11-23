import { InviteMemberProps } from "@routes/members/invite";
import { deepClone } from "@util/obj";
import modelAttributes from "@test/model/attributes";
import MemberKeys from "../keys/member";

const user = modelAttributes.user();

export type AcceptInviteProps = Record<string, never>;
export type ReadOneMemberProps = Record<string, never>;
export type ReadManyMemberProps = Record<string, never>;
export type MemberTypes = Record<
    MemberKeys,
    () =>
        | AcceptInviteProps
        | InviteMemberProps
        | ReadManyMemberProps
        | ReadOneMemberProps
>;

const inviteMember = (): InviteMemberProps =>
    deepClone({
        first_name: user.first_name,
        last_name: user.last_name,
        email: process.env.SECONDARY_TEST_EMAIL ?? "",
        phone: "4168245567",
    });
const acceptInvite = (): AcceptInviteProps => deepClone({});
const readOneMember = (): ReadOneMemberProps => deepClone({});
const readManyMembers = (): ReadManyMemberProps => deepClone({});

const attributes: MemberTypes = {
    inviteMember,
    acceptInvite,
    readManyMembers,
    readOneMember,
};

export default attributes;
