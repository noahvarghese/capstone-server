import { InviteMemberProps } from "@routes/members/invite";
import { deepClone } from "@util/obj";
import MemberKeys from "../keys/member";

export type AcceptInviteProps = Record<string, never>;
export type ReadOneMemberProps = undefined;
export type ReadManyMemberProps = undefined;
export type MemberTypes = Record<
    MemberKeys,
    () =>
        | AcceptInviteProps
        | InviteMemberProps
        | ReadManyMemberProps
        | ReadOneMemberProps
>;

export const inviteMember = (): InviteMemberProps =>
    deepClone({
        first_name: "Second",
        last_name: "User",
        email: process.env.SECONDARY_TEST_EMAIL ?? "",
        phone: "4168245567",
    });
export const acceptInvite = (): AcceptInviteProps => deepClone({});
export const readOneMember = (): ReadOneMemberProps => undefined;
export const readManyMembers = (): ReadManyMemberProps => undefined;

const attributes: MemberTypes = {
    inviteMember,
    acceptInvite,
    readManyMembers,
    readOneMember,
};

export default attributes;