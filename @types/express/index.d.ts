import { PermissionAttributes } from "@models/permission";
import { Connection } from "typeorm";

declare global {
    type RouteSettings = {
        permissions: (keyof Omit<PermissionAttributes, "updated_by_user_id">)[];
        passthrough: boolean;
        requireAuth: boolean;
    };

    namespace Express {
        interface Request {
            routeSettings: RouteSettings;
            dbConnection: Connection;
        }
    }
}
