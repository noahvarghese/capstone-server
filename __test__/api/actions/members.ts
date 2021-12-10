import User from "@models/user/user";
import BaseWorld from "@test/support/base_world";
import { apiRequest, ApiTestFn } from "@test/api/actions";

/**
 * Finds the token for the membership request
 * Then makes a rerquest to the url with the token
 * @param baseWorld
 */
export const acceptInvite = async function acceptInvite(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    token: string
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            withCookie: false,
            saveCookie: true,
        },
        param: token,
    });
} as ApiTestFn;

export const readOneMember = async function readOneMember(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    userId: number
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: { withCookie: true, saveCookie: false },
        param: userId.toString(),
        errorOnFail: false,
        method: "get",
    });
} as ApiTestFn;

export const deleteMember = async function deleteMember(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    userId: number
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: { withCookie: true, saveCookie: false },
        errorOnFail: false,
        method: "delete",
        param: userId.toString(),
    });
} as ApiTestFn;

export const updateMember = async function updateMember(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    { id, first_name, last_name, email, phone, birthday }: User
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: { withCookie: true, saveCookie: false },
        errorOnFail: false,
        method: "put",
        param: id.toString(),
        body: {
            first_name,
            last_name,
            email,
            phone,
            birthday: !isNaN(birthday.getTime())
                ? birthday.toISOString()
                : undefined,
        },
    });
} as ApiTestFn;

export const readManyMembers = async function readManyMembers(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    opts?: {
        query: {
            page?: number;
            limit?: number;
            sortField?: string;
            sortOrder?: "ASC" | "DESC" | "" | undefined;
            filterField?: string;
            filterIds?: number[];
            search?: string;
        };
    }
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: { withCookie: true, saveCookie: false },
        errorOnFail: false,
        method: "get",
        query: opts?.query ?? {},
    });
} as ApiTestFn;

/**
 * Sending an invite can be done for a 'new' user or existing
 * if user exists in database before api call, only an invite gets created
 * @param baseWorld
 * @param {"new" | "existing"} userType dictates whether to create a user via api
 */
export const inviteMember = async function inviteMember(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    userInfo: {
        email: string;
        phone?: string;
        first_name: string;
        last_name: string;
    }
): Promise<void> {
    await apiRequest(baseWorld, this.name, {
        cookie: {
            withCookie: true,
            saveCookie: false,
        },
        body: userInfo,
    });
} as ApiTestFn;

export const roleAssignment = async function roleAssignment(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    user_id: number,
    role_ids: number[]
) {
    await apiRequest(baseWorld, this.name, {
        cookie: { withCookie: true, saveCookie: false },
        method: "post",
        body: { user_id, role_ids },
        errorOnFail: false,
    });
} as ApiTestFn;

export const roleRemoval = async function roleRemoval(
    this: ApiTestFn,
    baseWorld: BaseWorld,
    user_id: number,
    role_ids: number[]
) {
    await apiRequest(baseWorld, this.name, {
        cookie: { withCookie: true, saveCookie: false },
        method: "delete",
        query: { user_id, role_ids },
        errorOnFail: false,
    });
} as ApiTestFn;
