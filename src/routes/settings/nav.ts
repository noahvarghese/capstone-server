import Department from "@models/department";
import Permission from "@models/permission";
import { Request, Response, Router } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    const {
        SqlConnection: connection,
        session: { user_id, current_business_id },
    } = req;

    const navLinks: { [o: string]: boolean } = {
        home: true,
        members: false,
        departments: false,
        roles: false,
        manuals: true,
        quizzes: true,
        reports: false,
        scores: false,
        logout: true,
    };

    try {
        const adminDepartment = await Department.getAdminForBusiness(
            Number(current_business_id),
            connection
        );

        if (await adminDepartment.hasUser(Number(user_id), connection)) {
            navLinks.members = true;
            navLinks.departments = true;
            navLinks.roles = true;
            navLinks.manuals = true;
            navLinks.quizzes = true;
            navLinks.reports = true;
            res.status(200).json(navLinks);
            return;
        }
    } catch (_) {
        res.status(500).json({ message: "no admin department found" });
    }

    // default links for regular users
    navLinks.manuals = true;
    navLinks.quizzes = true;
    navLinks.scores = true;

    const permissions = await Permission.getAllForUserAndBusiness(
        Number(user_id),
        Number(current_business_id),
        connection
    );

    for (const permission of permissions) {
        for (const [key, value] of Object.entries(permission)) {
            if (key.includes("users") && value === true) {
                navLinks.members = true;
            } else if (key.includes("department") && value === true) {
                navLinks.departments = true;
            } else if (key.includes("role") && value === true) {
                navLinks.roles = true;
            } else if (key.includes("reports") && value === true) {
                navLinks.reports = true;
            }
        }
    }

    res.status(200).json(navLinks);
    return;
});

export default router;
