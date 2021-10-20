import Department from "@models/department";
import Permission from "@models/permission";
import Logs from "@util/logs/logs";
import { Router, Response, Request } from "express";
const router = Router();

router.get("/", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
        SqlConnection,
    } = req;

    //check permissions
    const hasPermission = await Permission.checkPermission(
        Number(user_id),
        Number(current_business_id),
        SqlConnection,
        [
            "global_crud_department",
            "global_assign_resources_to_department",
            "global_assign_users_to_department",
        ]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    try {
        const departments = await SqlConnection.manager.find(Department, {
            where: { business_id: current_business_id },
        });
        res.status(200).json({ data: departments });
        return;
    } catch (e) {
        Logs.Error(e.message);
        res.status(500).json({ message: "Unable to get departments" });
        return;
    }
});

router.post("/", async (req: Request, res: Response) => {
    const {
        session: { current_business_id, user_id },
        SqlConnection,
        body,
    } = req;

    //check permissions
    const hasPermission = await Permission.checkPermission(
        Number(user_id),
        Number(current_business_id),
        SqlConnection,
        ["global_crud_department"]
    );

    if (!hasPermission) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
    }

    // check department exists
    const count = await SqlConnection.manager.count(Department, {
        where: { ...body },
    });

    if (count > 0) {
        res.status(405).json({ message: "department exists" });
        return;
    }

    // try create
    try {
        const result = await SqlConnection.manager.insert(
            Department,
            new Department(body)
        );

        if (result.identifiers.length === 1) {
            res.sendStatus(201);
            return;
        }
    } catch (e) {
        Logs.Error(e.message);
        res.status(500).json({ message: "Error creating department" });
    }
});

export default router;
