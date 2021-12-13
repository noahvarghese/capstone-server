import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import Logs from "@util/logs/logs";
import { Connection } from "typeorm";

export * from "./password";
export * from "./members/invite";

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
        throw new DataServiceError(
            `Invalid login ${email}`,
            ServiceErrorReasons.NOT_AUTHENTICATED
        );
    }

    if (!user.password) {
        throw new DataServiceError(
            "User not finished registration",
            ServiceErrorReasons.NOT_AUTHENTICATED
        );
    }

    try {
        const valid = await user.comparePassword(password);

        if (!valid) {
            throw new DataServiceError(
                "Invalid login",
                ServiceErrorReasons.NOT_AUTHENTICATED
            );
        }

        return user.id;
    } catch (e) {
        if (e instanceof DataServiceError) throw e;

        const { message } = e as Error;
        Logs.Error(message);
        throw new DataServiceError(
            "Unable to compare passwords",
            ServiceErrorReasons.UTILITY_ERROR
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
