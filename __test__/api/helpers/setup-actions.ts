import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import Permission, { PermissionAttributes } from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { apiRequest } from "@test/api/actions";
import attributes from "@test/api/attributes";
import { inviteMember as inviteMemberAttributes } from "@test/api/attributes/member";
import BaseWorld from "@test/support/base_world";

export async function createRegularUser(
    this: BaseWorld
): Promise<{ id: number; password: string; email: string }> {
    const email = process.env.MAIL_USER ?? "";
    const { password } = attributes.login();
    const { first_name, last_name, phone } = inviteMemberAttributes();

    const connection = this.getConnection();
    const user = await new User({
        email,
        first_name,
        last_name,
        phone,
    }).hashPassword(password);

    const res = await connection.manager.insert(User, user);
    const user_id = res.identifiers[0].id;

    const business_id = await getBusiness.call(this);

    await connection.manager.insert(
        Membership,
        new Membership({
            business_id,
            user_id,
            default: true,
        })
    );

    return { id: user_id, password, email };
}

// to be merged with helpers actions at some point
export async function loginUser(
    this: BaseWorld
): Promise<{ id: number; email: string; password: string }> {
    const res = await createRegularUser.call(this);
    const { email, password } = res;
    await apiRequest(this, "login", {
        cookie: {
            withCookie: false,
            saveCookie: true,
        },
        body: { email, password },
    });
    return res;
}

export async function getBusiness(this: BaseWorld): Promise<number> {
    const connection = this.getConnection();
    const { id } = await connection.manager.findOneOrFail(Business, {
        where: {
            name: this.getCustomProp<string[]>("businessNames")[0],
        },
    });
    return id;
}

export async function getDepartmentInBusiness(
    this: BaseWorld,
    name: string,
    business_id: number
): Promise<number> {
    const connection = this.getConnection();
    const { id } = await connection.manager.findOneOrFail(Department, {
        where: { business_id, name },
    });
    return id;
}

export async function getRoleInDepartment(
    this: BaseWorld,
    name: string,
    department_id: number
): Promise<number> {
    const connection = this.getConnection();
    const { id } = await connection.manager.findOneOrFail(Role, {
        where: { name, department_id },
    });
    return id;
}

export async function getUserFromRole(
    this: BaseWorld,
    role_id: number
): Promise<number> {
    const connection = this.getConnection();
    const { user_id } = await connection.manager.findOneOrFail(UserRole, {
        where: { role_id },
    });
    return user_id as number;
}

export async function getAdminUserId(this: BaseWorld): Promise<number> {
    const business = await getBusiness.call(this);
    const department = await getDepartmentInBusiness.call(
        this,
        "Admin",
        business
    );
    const role = await getRoleInDepartment.call(this, "General", department);
    const user = await getUserFromRole.call(this, role);
    return user;
}

export async function createDepartment(
    this: BaseWorld,
    name: string
): Promise<number> {
    const connection = this.getConnection();
    const business_id = await getBusiness.call(this);
    const admin = await getAdminUserId.call(this);

    const department = await connection.manager.insert(
        Department,
        new Department({ business_id, name, updated_by_user_id: admin })
    );

    return department.identifiers[0].id;
}

export async function createRole(
    this: BaseWorld,
    name: string,
    forDepartment: string,
    permissions?: PermissionAttributes
): Promise<number> {
    const connection = this.getConnection();
    const admin = await getAdminUserId.call(this);

    // all permissions false
    const permissionResult = await connection.manager.insert(
        Permission,
        new Permission({
            updated_by_user_id: admin,
            ...permissions,
        })
    );

    const roleResult = await connection.manager.insert(
        Role,
        new Role({
            name,
            updated_by_user_id: admin,
            department_id: await getDepartmentInBusiness.call(
                this,
                forDepartment,
                await getBusiness.call(this)
            ),
            permission_id: permissionResult.identifiers[0].id,
        })
    );

    return roleResult.identifiers[0].id;
}

export async function assignUserToRole(
    this: BaseWorld,
    user_id: number,
    role_id: number,
    admin_id?: number,
    is_primary_role?: boolean
): Promise<number> {
    const connection = this.getConnection();

    const res = await connection.manager.insert(UserRole, {
        role_id,
        user_id,
        updated_by_user_id: admin_id ?? user_id,
        primary_role_for_user: is_primary_role,
    });

    return res.identifiers[0].id;
}
