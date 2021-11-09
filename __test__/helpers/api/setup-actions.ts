import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { apiRequest } from "@test/helpers/api/test-actions";
import attributes from "@test/sample_data/api/attributes";
import BaseWorld from "@test/support/base_world";

// to be merged with helpers actions at some point
export async function loginUser(this: BaseWorld): Promise<void> {
    const email = "automailr.noreply@gmail.com";
    const { password } = attributes.login();
    const { first_name, last_name } = attributes.inviteUser();

    const connection = this.getConnection();
    const user = await new User({ email, first_name, last_name }).hashPassword(
        password
    );

    const res = await connection.manager.insert(User, user);

    const business = await connection
        .createQueryBuilder()
        .select("b")
        .from(Business, "b")
        .where("b.name = :name", {
            name: this.getCustomProp<string[]>("businessNames")[0],
        })
        .getOne();

    await connection.manager.insert(
        Membership,
        new Membership({
            business_id: business?.id,
            user_id: res.identifiers[0].id,
            default: true,
        })
    );

    // create new user in database with relationships
    //login

    await apiRequest.call(this, "login", {
        cookie: {
            withCookie: false,
            saveCookie: true,
        },
        body: { email, password },
    });
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
    return user_id;
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

export async function createRole(
    this: BaseWorld,
    name: string
): Promise<number> {
    const connection = this.getConnection();
    const admin = await getAdminUserId.call(this);

    const permissionResult = await connection.manager.insert(
        Permission,
        new Permission({
            updated_by_user_id: admin,
        })
    );

    const roleResult = await connection.manager.insert(
        Role,
        new Role({
            name,
            updated_by_user_id: admin,
            department_id: await getDepartmentInBusiness.call(
                this,
                "Admin",
                await getBusiness.call(this)
            ),
            permission_id: permissionResult.identifiers[0].id,
        })
    );

    return roleResult.identifiers[0].id;
}
