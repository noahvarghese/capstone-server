import { Request, Response, Router } from "express";
import validator from "validator";
import Business from "../../models/business";
import Department from "../../models/department";
import Permission from "../../models/permission";
import Role from "../../models/role";
import User from "../../models/user/user";
import UserRole from "../../models/user/user_role";
import Logs from "../../util/logs/logs";
import { sendMail } from "../../util/mail";
import { phoneValidator, postalCodeValidator } from "../../util/validators";

const router = Router();

export interface RegisterProps {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    province: string;
    birthday: Date | string;
    business_code: string;
    password: string;
    confirm_password: string;
    business_name: string;
    business_address: string;
    business_province: string;
    business_city: string;
    business_postal_code: string;
    business_phone: string;
    business_email: string;
}

router.post("/", async (req: Request, res: Response) => {
    // all possible keys that we could be expecting
    const {
        first_name,
        last_name,
        email,
        phone,
        address,
        birthday,
        city,
        postal_code,
        province,
        business_code,
        password,
        confirm_password,
        business_name,
        business_address,
        business_province,
        business_city,
        business_postal_code,
        business_phone,
        business_email,
    } = req.body as RegisterProps;

    // flag for what keys to use
    const skipBusinessValues = business_code && business_code.trim();

    // validate no keys are missing
    for (const [key, value] of Object.entries(req.body)) {
        if (
            !key.includes("business") ||
            (!skipBusinessValues && key !== "business_code")
        ) {
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
    }

    // Validate that data is in the expected format
    if (validator.isEmail(email) === false) {
        res.status(400).json({ message: "Invalid email.", field: "email" });
        return;
    }

    if (
        !(birthday instanceof Date) &&
        validator.isDate(birthday) === false &&
        isNaN(new Date(birthday).getTime())
    ) {
        res.status(400).json({
            message: "Invalid birthday",
            field: "birthday",
        });
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
    let business: Business;
    let newBusiness: boolean;

    // find business
    if (business_code) {
        try {
            business = await connection.manager.findOneOrFail(Business, {
                where: { code: business_code },
            });
            newBusiness = false;
        } catch (e) {
            res.status(400).json({
                message: "Invalid business code",
                field: "business_code",
            });
            return;
        }
    }
    // create business
    else {
        // validate business data
        if (validator.isEmail(business_email) === false) {
            res.status(400).json({
                message: "Invalid business email.",
                field: "business_email",
            });
            return;
        }

        if (!phoneValidator(phone)) {
            res.status(400).json({
                message: "Invalid business phone number",
                field: "business_phone",
            });
            return;
        }

        if (!postalCodeValidator(business_postal_code)) {
            res.status(400).json({
                message: "Invalid business postal code",
                field: "business_postal_code",
            });
            return;
        }

        business = connection.manager.create(Business, {
            name: business_name,
            country: "CA",
            email: business_email,
            postal_code: business_postal_code,
            phone: business_phone,
            province: business_province,
            address: business_address,
            city: business_city,
        });

        business.createCode();

        try {
            business = await connection.manager.save(business);
        } catch (e) {
            Logs.Error(e.message);
            res.status(500).json({ message: "Failed to create business" });
            return;
        }

        newBusiness = true;
    }

    const user = connection.manager.create(User, {
        first_name,
        last_name,
        address,
        city,
        postal_code,
        province,
        country: "CA",
        birthday,
        business_id: business.id,
        email,
        password,
        phone,
    });

    try {
        await connection.manager.save(await user.hashPassword(user.password));
    } catch (e) {
        Logs.Error(e.message);
        res.status(500).json({ message: "Failed to create user" });
        return;
    }

    // creates necessary admin resources
    // as well as an unassigned position for users that have not been assigned a role/department yet
    if (newBusiness) {
        // create department "Admin"
        let adminDepartment = new Department({
            business_id: business.id,
            updated_by_user_id: user.id,
            prevent_delete: true,
            name: "Admin",
        });

        adminDepartment = await connection.manager.save(
            Department,
            adminDepartment
        );

        let adminPermissions = new Permission({
            add_users_to_business: true,
            assign_users_to_department: true,
            assign_users_to_role: true,
            create_resources: true,
            assign_resources_to_department: true,
            assign_resources_to_role: true,
            updated_by_user_id: user.id,
        });

        adminPermissions = await connection.manager.save(
            Permission,
            adminPermissions
        );

        let adminRole = new Role({
            name: "General",
            department_id: adminDepartment.id,
            permission_id: adminPermissions.id,
            prevent_delete: true,
            updated_by_user_id: user.id,
        });

        adminRole = await connection.manager.save(Role, adminRole);

        // create department "Unassigned"
        let unassignedDepartment = new Department({
            business_id: business.id,
            updated_by_user_id: user.id,
            prevent_delete: true,
            name: "Unassigned",
        });

        unassignedDepartment = await connection.manager.save(
            Department,
            unassignedDepartment
        );

        let unassignedPermissions = new Permission({
            add_users_to_business: false,
            assign_resources_to_department: false,
            assign_resources_to_role: false,
            assign_users_to_department: false,
            assign_users_to_role: false,
            create_resources: false,
            updated_by_user_id: user.id,
        });

        unassignedPermissions = await connection.manager.save(
            Permission,
            unassignedPermissions
        );

        const unassignedRole = new Role({
            name: "General",
            updated_by_user_id: user.id,
            prevent_delete: true,
            permission_id: unassignedPermissions.id,
            department_id: unassignedDepartment.id,
        });

        await connection.manager.save(Role, unassignedRole);

        const adminAssignnment = new UserRole({
            user_id: user.id,
            updated_by_user_id: user.id,
            role_id: adminRole.id,
        });

        await connection.manager.save(UserRole, adminAssignnment);
    }

    // send proper registration email
    let html: string;
    let subject: string;

    if (newBusiness) {
        subject = "Welcome Onboard";
        html = `<div><h1>Welcome Onboard</h1><p>Thanks for joining us on this adventure ${business.name}.</p></div>`;
    } else {
        subject = "New Employee";
        html = `<div><h1>New Employee</h1><p>A new employee ${user.first_name} ${user.last_name} : ${user.email} has joined your company.</p></div>`;
    }

    try {
        await sendMail(business, {
            subject,
            to: business.email,
            html,
        });
    } catch (e) {
        Logs.Error(e.message);
        // Don't fail as the user and business are created and the welcome email is a nice to have
        // this can be debugged by reviewing the event table in the database
    }

    try {
        await sendMail(user, {
            subject: "Welcome Onboard",
            html: `<div><h1>Welcome Onboard</h1><p>thank you ${user.first_name} ${user.last_name} for registering. We have notified ${business.name} that you have signed up.</p></div>`,
        });
    } catch (e) {
        Logs.Error(e.message);
        // Don't fail as the user and business are created and the welcome email is a nice to have
        // this can be debugged by reviewing the event table in the database
    }

    req.session.user_id = user.id;
    req.session.business_id = user.business_id;
    res.sendStatus(201);
    return;
});

export default router;
