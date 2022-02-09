import { Request, Response } from "express";
import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import Logs from "@noahvarghese/logger";
import getJOpts from "@noahvarghese/get_j_opts";
import { bodyValidators, ExpectedBody } from "@util/formats/body";

const businessOpts: ExpectedBody = {
    name: {
        type: "string",
        required: true,
    },
    address: {
        type: "string",
        required: true,
    },
    city: {
        type: "string",
        required: true,
    },
    postal_code: {
        type: "string",
        required: true,
        format: "postal_code",
    },
    province: {
        type: "string",
        required: true,
        format: "province",
    },
};

const userOpts: ExpectedBody = {
    password: {
        type: "string",
        required: true,
    },
    confirm_password: {
        type: "string",
        required: true,
    },
    first_name: {
        type: "string",
        required: true,
    },
    last_name: {
        type: "string",
        required: true,
    },
    email: {
        type: "string",
        required: true,
        format: "email",
    },
    phone: {
        type: "string",
        required: false,
        format: "phone",
    },
};

interface BusinessOptions {
    name: string;
    address: string;
    city: string;
    postal_code: string;
    province: string;
}

interface UserOptions {
    password: string;
    confirm_password: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
}

export const registerController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { dbConnection: connection } = req;

    let b: BusinessOptions;
    let u: UserOptions;

    try {
        b = getJOpts(
            req.body,
            businessOpts,
            bodyValidators
        ) as unknown as BusinessOptions;

        u = getJOpts(
            req.body,
            userOpts,
            bodyValidators
        ) as unknown as UserOptions;
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.status(400).send(message);
        return;
    }

    if (u.password !== u.confirm_password) {
        res.status(400).send(
            "Invalid field confirm password doesn't match password"
        );
        return;
    }

    let businessCount = 0,
        userCount = 0;

    try {
        [businessCount, userCount] = await Promise.all([
            connection.manager.count(Business, {
                where: { name: b.name },
            }),
            connection.manager.count(User, { where: { email: u.email } }),
        ]);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
        return;
    }

    if (businessCount > 0 || userCount > 0) {
        res.status(400).send(
            `${businessCount > 0 ? "Business name" : "Email"} is in use`
        );
        return;
    }

    let user = new User(u);

    try {
        user = await user.hashPassword(u.password);
    } catch (_e) {
        const { message } = _e as Error;
        Logs.Error(message);
        res.sendStatus(500);
        return;
    }

    let user_id = NaN,
        business_id = NaN;

    try {
        await connection.transaction(async (tm) => {
            [
                {
                    identifiers: [{ id: user_id }],
                },
                {
                    identifiers: [{ id: business_id }],
                },
            ] = await Promise.all([
                tm.insert(User, user),
                tm.insert(Business, b),
            ]);

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
        res.sendStatus(500);
        return;
    }

    if (isNaN(user_id) || isNaN(business_id)) {
        res.sendStatus(500);
        return;
    }

    req.session.business_ids = [business_id];
    req.session.current_business_id = business_id;
    req.session.user_id = user_id;

    res.status(201).send(user_id);
};
