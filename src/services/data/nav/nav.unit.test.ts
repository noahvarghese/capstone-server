import Business from "@models/business";
import Department from "@models/department";
import Membership from "@models/membership";
import Permission from "@models/permission";
import Role from "@models/role";
import User from "@models/user/user";
import UserRole from "@models/user/user_role";
import { businessAttributes, userAttributes } from "@test/model/attributes";
import DBConnection from "@test/support/db_connection";
import Nav from ".";

beforeEach(async () => {
    await DBConnection.init();
});

afterEach(async () => {
    await DBConnection.close(true);
});

test("Admin checks links", async () => {
    const connection = await DBConnection.get();
    const [businessRes, userRes] = await Promise.all([
        connection.manager.insert(Business, businessAttributes()),
        connection.manager.insert(User, new User(userAttributes())),
    ]);
    const [permRes, deptRes] = await Promise.all([
        connection.manager.insert(
            Permission,
            new Permission({
                dept_assign_resources_to_role: true,
                dept_assign_users_to_role: true,
                dept_crud_resources: true,
                updated_by_user_id: userRes.identifiers[0].id,
                dept_crud_role: true,
                dept_view_reports: true,
                global_assign_resources_to_department: true,
                global_assign_resources_to_role: true,
                global_assign_users_to_department: true,
                global_assign_users_to_role: true,
                global_crud_department: true,
                global_crud_resources: true,
                global_crud_role: true,
                global_crud_users: true,
                global_view_reports: true,
            })
        ),
        // Needs to be the admin department
        connection.manager.insert(
            Department,
            new Department({
                name: "Admin",
                business_id: businessRes.identifiers[0].id,
                updated_by_user_id: userRes.identifiers[0].id,
            })
        ),
        connection.manager.insert(
            Membership,
            new Membership({
                user_id: userRes.identifiers[0].id,
                updated_by_user_id: userRes.identifiers[0].id,
                business_id: businessRes.identifiers[0].id,
            })
        ),
    ]);

    const roleRes = await connection.manager.insert(
        Role,
        new Role({
            name: "TEST",
            department_id: deptRes.identifiers[0].id,
            permission_id: permRes.identifiers[0].id,
            updated_by_user_id: userRes.identifiers[0].id,
        })
    );

    await connection.manager.insert(
        UserRole,
        new UserRole({
            primary_role_for_user: true,
            role_id: roleRes.identifiers[0].id,
            updated_by_user_id: userRes.identifiers[0].id,
            user_id: userRes.identifiers[0].id,
        })
    );

    const nav = new Nav(
        Number(businessRes.identifiers[0].id),
        Number(userRes.identifiers[0].id)
    );

    const links = await nav.getLinks();
    const expectedNavLinks = Nav.produceAdminLinks();
    expect(links).toStrictEqual(expectedNavLinks);
});

test("regular user checks links", async () => {
    const connection = await DBConnection.get();
    const [businessRes, userRes] = await Promise.all([
        connection.manager.insert(Business, businessAttributes()),
        connection.manager.insert(User, new User(userAttributes())),
    ]);
    const [permRes, deptRes] = await Promise.all([
        connection.manager.insert(
            Permission,
            new Permission({
                updated_by_user_id: userRes.identifiers[0].id,
            })
        ),
        connection.manager.insert(
            Department,
            new Department({
                name: "TEST",
                business_id: businessRes.identifiers[0].id,
                updated_by_user_id: userRes.identifiers[0].id,
            })
        ),
        connection.manager.insert(
            Membership,
            new Membership({
                user_id: userRes.identifiers[0].id,
                updated_by_user_id: userRes.identifiers[0].id,
                business_id: businessRes.identifiers[0].id,
            })
        ),
    ]);

    const roleRes = await connection.manager.insert(
        Role,
        new Role({
            name: "TEST",
            department_id: deptRes.identifiers[0].id,
            permission_id: permRes.identifiers[0].id,
            updated_by_user_id: userRes.identifiers[0].id,
        })
    );

    await connection.manager.insert(
        UserRole,
        new UserRole({
            primary_role_for_user: true,
            role_id: roleRes.identifiers[0].id,
            updated_by_user_id: userRes.identifiers[0].id,
            user_id: userRes.identifiers[0].id,
        })
    );

    const nav = new Nav(
        Number(businessRes.identifiers[0].id),
        Number(userRes.identifiers[0].id)
    );

    const links = await nav.getLinks();
    const expectedNavLinks = Nav.produceDefaultLinks();
    expect(links).toStrictEqual(expectedNavLinks);
});
