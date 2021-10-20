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
import {
    emptyChecker,
    phoneValidator,
    postalCodeValidator,
} from "../../util/validators";

const router = Router();

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

router.post("/", async (req: Request, res: Response) => {
    // validate no keys are missing
    const result = emptyChecker<RegisterBusinessProps>(
        Object.assign(emptyRegisterBusinessProps(), req.body)
    );

    if (result) {
        res.status(400).json(result);
        return;
    }

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
    } = req.body as RegisterBusinessProps;

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
                await new User({
                    first_name,
                    last_name,
                    email,
                    phone,
                }).hashPassword(password)
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
            new Membership({
                user_id: userId,
                business_id: businessId,
                default: true,
            })
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
                primary_role_for_user: true,
            })
        );
    } catch ({ message }) {
        res.status(500).json({ message });
        return;
    }

    req.session.business_ids = [businessId];
    req.session.user_id = userId;
    req.session.current_business_id = businessId;

    res.sendStatus(201);
    return;
});

export default router;
