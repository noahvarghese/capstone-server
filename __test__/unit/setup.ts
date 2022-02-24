import { getMockRes } from "@jest-mock/express";
import Business from "@models/business";
import User from "@models/user/user";
import { registerController } from "@routes/auth/register/post";
import { Request } from "express";
import { businessAttributes, userAttributes } from "@test/model/attributes";
import { Connection } from "typeorm";

const { res } = getMockRes();

/**
 * Creates Business, User, Membership, Department, Permission, Role, and UserRole objects
 * Sets up department and role as admin, with all permissions
 * Prevent edit and delete of membership, department, role and user role objects as this user is the owner of the business
 * @param conn database connection
 * @returns business id (a positive integer) or NaN if not found
 * @throws on database error
 */
export const setupAdmin = async (
    conn: Connection
): Promise<{ business_id: number; user_id: number }> => {
    const b = businessAttributes();
    const u = userAttributes();

    await registerController(
        {
            dbConnection: conn,
            body: {
                address: b.address,
                city: b.city,
                confirm_password: u.password,
                password: u.password,
                name: b.name,
                email: u.email,
                first_name: u.first_name,
                last_name: u.last_name,
                phone: u.phone,
                postal_code: b.postal_code,
                province: b.province,
            },
            session: {},
        } as Request,
        res
    );

    const [{ id: business_id }, { id: user_id }] = await Promise.all([
        conn.manager.findOneOrFail(Business),
        conn.manager.findOneOrFail(User),
    ]);
    return {
        business_id,
        user_id,
    };
};
