import Business from "@models/business";
import User from "@models/user/user";
// import { registerController } from "@routes/auth/register/post";
// import { businessAttributes, userAttributes } from "@test/model/attributes";
import { Connection } from "typeorm";

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
    // const b = businessAttributes();
    // const u = userAttributes();

    // await registerHandler(conn, {
    //     address: b.address,
    //     city: b.city,
    //     confirm_password: u.password,
    //     password: u.password,
    //     name: b.name,
    //     email: u.email,
    //     first_name: u.first_name,
    //     last_name: u.last_name,
    //     phone: u.phone,
    //     postal_code: b.postal_code,
    //     province: b.province,
    // });

    return {
        business_id: (await conn.manager.findOne(Business))?.id ?? NaN,
        user_id: (await conn.manager.findOne(User))?.id ?? NaN,
    };
};
