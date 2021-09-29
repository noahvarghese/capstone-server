import { Request, Response, Router } from "express";
import validator from "validator";
import Business from "../../models/business";
import Department from "../../models/department";
import Membership from "../../models/membership";
import Permission from "../../models/permission";
import Role from "../../models/role";
import User from "../../models/user/user";
import UserRole from "../../models/user/user_role";
import Model from "../../util/model";
import { phoneValidator, postalCodeValidator } from "../../util/validators";

const router = Router();

export interface RegisterProps {
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

router.post("/", async (req: Request, res: Response) => {
    // all possible keys that we could be expecting
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
        confirm_password,
    } = req.body as RegisterProps;

    // validate no keys are missing
    for (const [key, value] of Object.entries(req.body)) {
        if (!value || (value as string).trim() === "") {
            // returns bad field and explanation
            res.status(400).json({
                message: `${(key[0].toUpperCase() + key.substring(1))
                    .split("_")
                    .join(" ")} cannot be empty`,
                field: key,
            });
            return;
        }
    }

    // Validate that data is in the expected format
    if (validator.isEmail(email) === false) {
        res.status(400).json({ message: "Invalid email.", field: "email" });
        return;
    }

    if (!phoneValidator(phone)) {
        res.status(400).json({
            message: "Invalid phone number",
            field: "phone",
        });
        return;
    }
    if (!postalCodeValidator(postal_code)) {
        res.status(400).json({
            message: "Invalid postal code",
            field: "postal_code",
        });
        return;
    }
    if (password.length < 8) {
        res.status(400).json({
            message: "Password must be at least 8 characters",
            field: "password",
        });
        return;
    }
    if (password !== confirm_password) {
        res.status(400).json({
            message: "Passwords do not match",
            field: "password",
        });
        return;
    }

    const { SqlConnection: connection } = req;

    // check for existing business
    const foundBusiness = await connection.manager.find(Business, {
        where: { name },
    });

    if (foundBusiness.length !== 0) {
        res.status(400).json({
            message: "Business already exists",
        });
        return;
    }

    const foundUser = await connection.manager.find(User, { where: { email } });

    if (foundUser.length !== 0) {
        res.status(400).json({
            message: "User already exists, please use a different email",
        });
    }

    // Create necessary records and associations
    let businessId: number;
    let userId: number;
    let departmentId: number;
    let permissionId: number;
    let roleId: number;

    try {
        businessId = (
            await Model.create<Business>(
                connection,
                Business,
                new Business({ name, address, city, postal_code, province })
            )
        ).id;
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }

    try {
        userId = (
            await Model.create<User>(
                connection,
                User,
                new User({ first_name, last_name, email, phone })
            )
        ).id;
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }

    try {
        await Model.create<Membership>(
            connection,
            Membership,
            new Membership({ user_id: userId, business_id: businessId })
        );
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }

    try {
        departmentId = (
            await Model.create<Department>(
                connection,
                Department,
                new Department({
                    business_id: businessId,
                    updated_by_user_id: userId,
                    prevent_delete: true,
                    prevent_edit: true,
                    name: "Admin",
                })
            )
        ).id;
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }

    try {
        permissionId = (
            await Model.create<Permission>(
                connection,
                Permission,
                new Permission({
                    add_users: true,
                    assign_resources_to_department: true,
                    assign_resources_to_role: true,
                    assign_users_to_department: true,
                    assign_users_to_role: true,
                    create_resources: true,
                    delete_users: true,
                    edit_users: true,
                    updated_by_user_id: userId,
                })
            )
        ).id;
    } catch ({ message }) {
        res.status(500).json({ message });
        return;
    }

    try {
        roleId = (
            await Model.create<Role>(
                connection,
                Role,
                new Role({
                    updated_by_user_id: userId,
                    prevent_delete: true,
                    name: "General",
                    department_id: departmentId,
                    permission_id: permissionId,
                    prevent_edit: true,
                })
            )
        ).id;
    } catch ({ message }) {
        res.status(500).json({ message });
        return;
    }

    try {
        await Model.create<UserRole>(
            connection,
            UserRole,
            new UserRole({
                user_id: userId,
                updated_by_user_id: userId,
                role_id: roleId,
            })
        );
    } catch ({ message }) {
        res.status(500).json({ message });
        return;
    }

    req.session.business_id = businessId;
    req.session.user_id = userId;
    res.sendStatus(201);
});

export default router;
