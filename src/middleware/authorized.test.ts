import DBConnection from "@test/support/db_connection";
import { NextFunction, Response } from "express";
import Permission from "@models/permission";
import { authorized } from "./authorized";
import Routes from "@middleware/routes.json";
import { getMockReq, getMockRes } from "@jest-mock/express";
import Business from "@models/business";
import { businessAttributes, userAttributes } from "@test/model/attributes";
import User from "@models/user/user";
import Membership from "@models/membership";
import Role from "@models/role";
import Department from "@models/department";
import UserRole from "@models/user/user_role";
import { deepClone } from "@util/obj";

let userId: number, businessId: number;
const cases = deepClone(Routes.filter((r) => r.requireAuth));
let res: Response, next: NextFunction, clearMockRes: () => void;

beforeAll(async () => {
    await DBConnection.init();
});
afterAll(async () => {
    await DBConnection.close();
});

beforeEach(async () => {
    const mockRes = getMockRes();
    res = mockRes.res;
    next = mockRes.next;
    clearMockRes = mockRes.clearMockRes;
});

afterEach(async () => {
    clearMockRes();
});

describe("Admin can access everything", () => {
    afterAll(async () => {
        await DBConnection.reset();
    });

    beforeAll(async () => {
        const connection = await DBConnection.get();

        const [businessRes, userRes] = await Promise.all([
            connection.manager.insert(
                Business,
                new Business(businessAttributes())
            ),
            connection.manager.insert(User, new User(userAttributes())),
        ]);

        userId = userRes.identifiers[0].id;
        businessId = businessRes.identifiers[0].id;

        const [permRes, deptRes] = await Promise.all([
            connection.manager.insert(
                Permission,
                new Permission({
                    dept_assign_resources_to_role: true,
                    dept_assign_users_to_role: true,
                    dept_crud_resources: true,
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
                    updated_by_user_id: userId,
                })
            ),
            connection.manager.insert(
                Department,
                new Department({
                    business_id: businessId,
                    updated_by_user_id: userId,
                    name: "Admin",
                })
            ),
            connection.manager.insert(
                Membership,
                new Membership({
                    updated_by_user_id: userId,
                    user_id: userId,
                    business_id: businessId,
                    default: true,
                })
            ),
        ]);

        const roleRes = await connection.manager.insert(
            Role,
            new Role({
                department_id: deptRes.identifiers[0].id,
                updated_by_user_id: userId,
                name: "General",
                permission_id: permRes.identifiers[0].id,
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
    });

    test.each(cases)("Admin can $method $url", async (route) => {
        const req = getMockReq({
            SqlConnection: await DBConnection.get(),
            routeSettings: route,
            session: {
                user_id: userId,
                current_business_id: businessId,
                business_ids: [businessId],
            },
        });

        await authorized(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

describe("Unauthorized user", () => {
    afterAll(async () => {
        await DBConnection.reset();
    });

    beforeAll(async () => {
        const connection = await DBConnection.get();

        const [businessRes, userRes] = await Promise.all([
            connection.manager.insert(
                Business,
                new Business(businessAttributes())
            ),
            connection.manager.insert(User, new User(userAttributes())),
        ]);

        userId = userRes.identifiers[0].id;
        businessId = businessRes.identifiers[0].id;

        const [permRes, deptRes] = await Promise.all([
            connection.manager.insert(
                Permission,
                new Permission({
                    updated_by_user_id: userId,
                })
            ),
            connection.manager.insert(
                Department,
                new Department({
                    business_id: businessId,
                    updated_by_user_id: userId,
                    name: "Admin",
                })
            ),
            connection.manager.insert(
                Membership,
                new Membership({
                    updated_by_user_id: userId,
                    user_id: userId,
                    business_id: businessId,
                    default: true,
                })
            ),
        ]);

        const roleRes = await connection.manager.insert(
            Role,
            new Role({
                department_id: deptRes.identifiers[0].id,
                updated_by_user_id: userId,
                name: "General",
                permission_id: permRes.identifiers[0].id,
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
    });

    describe("can access $method $url with their own id", () => {
        test.each(
            cases.filter((r) => r.permissions.length > 0 && r.selfOverride)
        )("$method $url", async (route) => {
            // check whether to user testURL or url
            let url = !new RegExp(route.url).test(route.url)
                ? route.testURL ?? ""
                : route.url;

            // trim backslash if it exists and the url is longer than just the root
            url =
                url.length > 1 && url[url.length - 1] === "/"
                    ? url.substring(0, url.length - 2)
                    : url;

            // Sanity check
            if (url === "")
                throw new Error(
                    "Invalid route " + route.method + " " + route.url
                );

            url = url
                .split("/")
                .reverse()
                .slice(1)
                .reverse()
                .concat([userId.toString()])
                .join("/");

            const req = getMockReq({
                path: url,
                SqlConnection: await DBConnection.get(),
                routeSettings: route,
                session: {
                    user_id: userId,
                    current_business_id: businessId,
                    business_ids: [businessId],
                },
            });

            await authorized(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    // Reduce routes as if no permissions are required then any unauthenticated user can get in
    // test.each(cases.filter((r) => r.permissions.length > 0))(
    //     "cannot access $method $url",
    //     async (route) => {
    //         const req = getMockReq({
    //             SqlConnection: await DBConnection.get(),
    //             routeSettings: route,
    //             session: {
    //                 user_id: userId,
    //                 current_business_id: businessId,
    //                 business_ids: [businessId],
    //             },
    //         });

    //         await authorized(req, res, next);

    //         expect(res.status).toHaveBeenCalledWith(403);
    //         expect(res.json).toHaveBeenCalledWith(
    //             expect.objectContaining({
    //                 message: "Insufficient permissions",
    //             })
    //         );
    //     }
    // );
});
