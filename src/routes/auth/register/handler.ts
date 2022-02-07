import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import Logs from "@noahvarghese/logger";
import DataServiceError, { ServiceErrorReasons } from "@util/errors/service";
import { Connection } from "typeorm";

export interface RegisterBusinessProps {
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    address: string;
    city: string;
    postal_code: string;
    province: string;
    password: string;
    confirm_password: string;
}

export const registerHandler = async (
    connection: Connection,
    options: RegisterBusinessProps
): Promise<void> => {
    let businessCount = 0,
        userCount = 0;

    try {
        [businessCount, userCount] = await Promise.all([
            connection.manager.count(Business, {
                where: { name: options.name },
            }),
            connection.manager.count(User, { where: { email: options.email } }),
        ]);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new DataServiceError(ServiceErrorReasons.DATABASE);
    }

    if (businessCount > 0 || userCount > 0)
        throw new DataServiceError(
            ServiceErrorReasons.PARAMETERS,
            `${businessCount > 0 ? "Business name" : "Email"} is in use`
        );

    let u = new User({
        first_name: options.first_name,
        last_name: options.last_name,
        email: options.email,
        phone: options.phone,
    });

    try {
        u = await u.hashPassword(options.password);
    } catch (_e) {
        throw new DataServiceError(
            ServiceErrorReasons.UTILITY,
            "failed to set password"
        );
    }

    try {
        await connection.transaction(async (tm) => {
            const [userRes, businessRes] = await Promise.all([
                tm.insert(User, u),
                tm.insert(Business, {
                    name: options.name,
                    address: options.address,
                    city: options.city,
                    postal_code: options.postal_code,
                    province: options.province,
                }),
            ]);

            const business_id = businessRes.identifiers[0].id,
                user_id = userRes.identifiers[0].id;

            const [departmentRes, permissionRes] = await Promise.all([
                tm.insert(
                    Department,
                    new Department({
                        business_id,
                        updated_by_user_id: user_id,
                        name: "Admin",
                        prevent_delete: true,
                        prevent_edit: true,
                    })
                ),
                tm.insert(
                    Permission,
                    new Permission({
                        updated_by_user_id: user_id,
                        global_assign_resources_to_role: true,
                        global_assign_users_to_role: true,
                        global_crud_department: true,
                        global_crud_resources: true,
                        global_crud_role: true,
                        global_crud_users: true,
                        global_view_reports: true,
                        dept_assign_resources_to_role: true,
                        dept_assign_users_to_role: true,
                        dept_crud_resources: true,
                        dept_crud_role: true,
                        dept_view_reports: true,
                    })
                ),
                tm.insert(
                    Membership,
                    new Membership({
                        user_id,
                        business_id,
                        updated_by_user_id: user_id,
                        prevent_delete: true,
                        default_option: true,
                    })
                ),
            ]);

            const department_id = departmentRes.identifiers[0].id,
                permission_id = permissionRes.identifiers[0].id;

            const roleRes = await tm.insert(
                Role,
                new Role({
                    department_id,
                    permission_id,
                    name: "General",
                    prevent_edit: true,
                    prevent_delete: true,
                    updated_by_user_id: user_id,
                })
            );

            const role_id = roleRes.identifiers[0].id;

            await tm.insert(
                UserRole,
                new UserRole({ updated_by_user_id: user_id, user_id, role_id })
            );
        });
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        throw new DataServiceError(ServiceErrorReasons.DATABASE);
    }
};
