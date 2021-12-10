import { InviteMemberProps } from "@services/data/user/members/invite";
import { deepClone } from "@util/obj";
import MemberKeys from "../keys/member";

export type AcceptInviteProps = Record<string, never>;
export type ReadOneMemberProps = undefined;
export type ReadManyMemberProps = undefined;
export type DeleteMemberProps = undefined;
export type UpdateMemberProps = InviteMemberProps & { birthday: Date };
export type RoleAssignmentProps = { user_id: number; role_ids: number[] };
export type RoleRemovalProps = undefined;
export type MemberTypes = Record<
    MemberKeys,
    () =>
        | AcceptInviteProps
        | InviteMemberProps
        | ReadManyMemberProps
        | ReadOneMemberProps
        | DeleteMemberProps
        | UpdateMemberProps
        | RoleAssignmentProps
        | RoleRemovalProps
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
export const deleteMember = (): DeleteMemberProps => undefined;
export const updateMember = (): UpdateMemberProps =>
    deepClone({ ...inviteMember(), birthday: new Date() });
export const roleAssignment = (): RoleAssignmentProps =>
    deepClone({ user_id: NaN, role_ids: [] });
export const roleRemoval = (): RoleRemovalProps => undefined;

const attributes: MemberTypes = {
    inviteMember,
    acceptInvite,
    readManyMembers,
    readOneMember,
    deleteMember,
    updateMember,
    roleAssignment,
    roleRemoval,
};

export default attributes;
