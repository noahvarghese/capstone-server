import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import MembershipRequest from "@models/membership_request";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import {
    requestResetPasswordEmail,
    resetPasswordEmail,
    sendUserInviteEmail,
} from "@services/email";
import ServiceError, { ServiceErrorReasons } from "@util/errors/service_error";
import Logs from "@util/logs/logs";
import { Connection, MoreThan } from "typeorm";

export type MemberResponse = { id: number; name: string; default: boolean };

/**
 * Gets list of businesses that the user is a part of
 * @param connection
 * @param user_id
 * @returns {MemberResponse[]}
 */
export const getMemberships = async (
    connection: Connection,
    user_id: number
): Promise<MemberResponse[]> => {
    try {
        const res = await connection
            .createQueryBuilder()
            .select("b.id, b.name, m.default")
            .from(Membership, "m")
            .where("m.user_id = :user_id", { user_id })
            .leftJoin(Business, "b", "b.id = m.business_id")
            .orderBy("m.created_on", "DESC")
            .getRawMany();

        return res.map((r) => ({
            id: r.id,
            name: r.name,
            default: r.default_option === 1,
        }));
    } catch (e) {
        const { message } = e as Error;
        Logs.Error(message);
        return [];
    }
};

export interface InviteMemberProps {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
}

export const emptyInviteUser = (): InviteMemberProps => ({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
});

/**
 * Sends MembershipRequest details to the given user
 * Checks if there is a membership first (fails if true)
 * Then checks if there is a MembershipRequest (generates new token if true, creates new MembershipRequest if false)
 * Then sends email to the given user
 * @param {Connection} connection Database connection
 * @param {InviteMemberProps} userInfo Basis for a new User
 * @param {number} business_id
 * @param {number} updated_by_user_id
 */
export const sendInvite = async (
    connection: Connection,
    userInfo: InviteMemberProps,
    business_id: number,
    updated_by_user_id: number
): Promise<void> => {
    // this should do an upsert as the email is marked as UNIQUE in the database
    let user = await connection.manager.findOne(User, {
        where: { email: userInfo.email },
    });

    if (!user) {
        const result = await connection.manager.insert(
            User,
            new User(userInfo)
        );
        user = await connection.manager.findOneOrFail(User, {
            where: { id: result.identifiers[0].id },
        });
    }

    // Checks whether user and business are associated already
    const existingMembership = await connection.manager.findOne(Membership, {
        where: {
            user_id: user.id,
            business_id,
        },
    });

    if (existingMembership)
        throw new ServiceError(
            "User is a member of the business already",
            ServiceErrorReasons.PARAMS
        );

    // Update token if an association request exists
    // Otherwise create a new request
    let membershipRequest = await connection.manager.findOne(
        MembershipRequest,
        { where: { business_id, user_id: user.id } }
    );

    if (membershipRequest) {
        membershipRequest.generateToken();

        await connection.manager.update(
            MembershipRequest,
            {
                user_id: user.id,
                business_id,
            },
            membershipRequest
        );
    } else {
        membershipRequest = new MembershipRequest({
            user_id: user.id,
            business_id,
            updated_by_user_id,
        });

        await connection.manager.insert(MembershipRequest, membershipRequest);
    }

    // Get info to send notification email to 'new' User

    const [sender, business] = await Promise.all([
        connection.manager.findOne(User, {
            where: { id: updated_by_user_id },
        }),
        connection.manager.findOne(Business, {
            where: { id: business_id },
        }),
    ]);

    if (!sender || !business) {
        throw new ServiceError(
            "Unable to retrive information to notify user by email",
            ServiceErrorReasons.SERVER
        );
    }

    await sendUserInviteEmail(business, membershipRequest.token, sender, user);
};

/**
 * Confirms the association between user and business
 * Allows user to set password afterwards
 * @param connection
 * @param token
 */
export const acceptInvite = async (
    connection: Connection,
    token: string
): Promise<void> => {
    const membershipRequest = await connection.manager.findOne(
        MembershipRequest,
        { where: { token, token_expiry: MoreThan(new Date()) } }
    );

    if (!membershipRequest) {
        throw new ServiceError(
            "No invitation found, please ask your manager for a new invitation",
            ServiceErrorReasons.PARAMS
        );
    }

    // check if there is an existing membership
    // only the first membership gets set to default automatically
    const memberships = await getMemberships(
        connection,
        membershipRequest.user_id
    );

    const setDefault = memberships.length === 0;

    await connection.manager.insert(
        Membership,
        new Membership({
            business_id: membershipRequest.business_id,
            updated_by_user_id: membershipRequest.user_id,
            user_id: membershipRequest.user_id,
            default: setDefault,
        })
    );

    const [user] = await Promise.all([
        // Check if user needs to finish registration
        await connection.manager.findOne(User, {
            where: { id: membershipRequest.user_id },
        }),
        // Delete request
        connection.manager.delete(MembershipRequest, membershipRequest),
    ]);

    if (!user) {
        throw new ServiceError(
            "Couldn't retrieve user",
            ServiceErrorReasons.SERVER
        );
    }

    if (!user.password) {
        // Allow user to finish registration
        await enablePasswordReset(connection, user);
    }
};

/**
 * Creates token and expiry
 * And then sends email to notify user they can change their password
 * @param connection
 * @param user
 */
export const enablePasswordReset = async (
    connection: Connection,
    user: User
): Promise<void> => {
    user.createToken();

    await connection.manager.update(
        User,
        { email: user.email },
        { token: user.token, token_expiry: user.token_expiry }
    );

    await requestResetPasswordEmail(user);
};

/**
 * resets the user's password
 * @param connection
 * @param token
 * @param password
 * @param confirmPassword
 * @returns {number} user id
 */
export const resetPassword = async (
    connection: Connection,
    token: string,
    password: string
): Promise<number> => {
    const user = await connection.manager.findOneOrFail(User, {
        where: {
            token,
            token_expiry: MoreThan(new Date()),
        },
    });

    if (!user)
        throw new ServiceError("Invalid token", ServiceErrorReasons.AUTH);

    if (!(await user.resetPassword(password, token))) {
        throw new ServiceError(
            "Password not long enough",
            ServiceErrorReasons.PARAMS
        );
    }

    await connection.manager.update(
        User,
        { id: user.id },
        {
            token: user.token,
            token_expiry: user.token_expiry,
            password: user.password,
        }
    );

    await resetPasswordEmail(user);
    return user.id;
};

/**
 * Checks the user is who they say they are
 * @param connection
 * @param email
 * @param password
 * @returns {number | undefined} user id if successful
 */
export const findByLogin = async (
    connection: Connection,
    email: string,
    password: string
): Promise<number> => {
    const user = await connection.manager.findOne(User, { where: { email } });

    if (!user) {
        throw new ServiceError(
            `Invalid login ${email}`,
            ServiceErrorReasons.AUTH
        );
    }

    if (!user.password) {
        throw new ServiceError(
            "User not finished registration",
            ServiceErrorReasons.AUTH
        );
    }

    try {
        const valid = await user.comparePassword(password);
        if (!valid) {
            throw new ServiceError("Invalid login", ServiceErrorReasons.AUTH);
        }
        return user.id;
    } catch (e) {
        if (e instanceof ServiceError) throw e;

        const { message } = e as Error;
        Logs.Error(message);
        throw new ServiceError(
            "Unable to compare passwords",
            ServiceErrorReasons.SERVER
        );
    }
};

export interface RegisterBusinessProps {
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    province: string;
    password: string;
    confirm_password: string;
}

export const emptyRegisterBusinessProps = (): RegisterBusinessProps => ({
    name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    province: "",
    password: "",
    confirm_password: "",
});

export const registerAdmin = async (
    connection: Connection,
    props: RegisterBusinessProps
): Promise<{ business_id: number; user_id: number }> => {
    const {
        name,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        postal_code,
        province,
        password,
    } = props;

    const user = new User({
        first_name,
        last_name,
        email,
        phone,
    });

    await user.hashPassword(password);

    const [businessResult, userResult] = await Promise.all([
        connection.manager.insert(
            Business,
            new Business({ name, address, city, postal_code, province })
        ),
        connection.manager.insert(User, user),
    ]);

    const user_id = userResult.identifiers[0].id;
    const business_id = businessResult.identifiers[0].id;

    const results = await Promise.all([
        connection.manager.insert(
            Membership,
            new Membership({
                user_id,
                business_id,
                default: true,
            })
        ),
        connection.manager.insert(
            Department,
            new Department({
                business_id,
                updated_by_user_id: user_id,
                prevent_delete: true,
                prevent_edit: true,
                name: "Admin",
            })
        ),
        connection.manager.insert(
            Permission,
            new Permission({
                global_crud_users: true,
                global_crud_department: true,
                global_crud_role: true,
                global_crud_resources: true,
                global_assign_users_to_department: true,
                global_assign_users_to_role: true,
                global_assign_resources_to_department: true,
                global_assign_resources_to_role: true,
                global_view_reports: true,
                dept_crud_role: true,
                dept_crud_resources: true,
                dept_assign_users_to_role: true,
                dept_assign_resources_to_role: true,
                dept_view_reports: true,
                updated_by_user_id: user_id,
            })
        ),
    ]);

    const department_id = results[1].identifiers[0].id,
        permission_id = results[2].identifiers[0].id;

    const roleResult = await connection.manager.insert(
        Role,
        new Role({
            updated_by_user_id: user_id,
            prevent_delete: true,
            name: "General",
            department_id,
            permission_id,
            prevent_edit: true,
        })
    );

    const role_id = roleResult.identifiers[0].id;

    await connection.manager.insert(
        UserRole,
        new UserRole({
            user_id,
            updated_by_user_id: user_id,
            role_id,
            primary_role_for_user: true,
        })
    );

    return { business_id, user_id };
};
