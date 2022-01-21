import { InviteMemberProps } from "@controllers/member_invite";
import MembershipInvitation from "@models/membership_invitation";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import Logs from "@util/logs/logs";
import * as userService from "@services/data/user";
import * as businessService from "@services/data/business";
import { EntityManager, getConnection } from "typeorm";
import User from "@models/user/user";

export const hasUser = async (
    where: {
        user_id: number;
        business_id: number;
    },
    entityManager?: EntityManager
): Promise<boolean> => {
    const manager = entityManager ?? getConnection().manager;

    try {
        const count = await manager.count(MembershipInvitation, {
            where,
        });

        return count > 0;
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            "Unable to find invitation",
            ServiceErrorReasons.DATABASE_ERROR
        );
    }
};

export const refresh = async (
    where: {
        user_id: number;
        business_id: number;
    },
    entityManager?: EntityManager
): Promise<string> => {
    const manager = entityManager ?? getConnection().manager;

    try {
        const membershipInvite = await manager.findOneOrFail(
            MembershipInvitation,
            {
                where,
            }
        );

        membershipInvite.generateToken();
        await manager.update(MembershipInvitation, where, membershipInvite);
        return membershipInvite.token;
    } catch (e) {
        const { message } = e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            "Unable to refresh token",
            ServiceErrorReasons.DATABASE_ERROR
        );
    }
};

export const create = async (
        userInfo: InviteMemberProps,
        business_id: number,
        updated_by_user_id: number
): Promise<string> => {
    const { token, user } = await new Promise<{ token: string; user: User }>((res, rej) => {
        getConnection().transaction(async (entityManager) => {
            let user: User;

            if (
                !(await userService.exists(userInfo.email, entityManager))
            ) {
                // This is allowed to throw an error because the error type is expected at the route level
                const id = await userService.create(
                    { ...userInfo, password: "" },
                    entityManager
                );
                // We expect this to pass if the above doesn't throw an error
                user = await entityManager.findOneOrFail(User, {
                    where: { id },
                });
            } else {
                // This should pass because exists passes
                user = await entityManager.findOneOrFail(User, {
                    where: { email: userInfo.email },
                });
            }

            if (
                await businessService.hasUser(
                    user.id,
                    business_id,
                    entityManager
                )
            ) {
                throw new DataServiceError(
                    "User is a member of the business already",
                    ServiceErrorReasons.PARAMETERS_MISSING
                );
            }

            // Update token if an association request exists
            // Otherwise create a new request
            let token = "";

            const where = {
                business_id,
                user_id: user.id,
            };

            if (await hasUser(where, entityManager)) {
                token = await refresh(
                    where,
                    entityManager
                );
            } else {
                token = await new Promise<string>((res, rej) => {

                })
            }
            res({ token, user });
        }).catch((reason) => rej(reason));


    try {
        const invitation = new MembershipInvitation();
        await manager.insert(MembershipInvitation, invitation);
        return invitation.token;
    } catch (e) {
        const { message } = e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            "Unable to refresh token",
            ServiceErrorReasons.DATABASE_ERROR
        );
    }
};
