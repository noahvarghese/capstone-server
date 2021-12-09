import { Connection } from "typeorm";
import { PermissionAttributes } from "@models/permission";

declare global {
    type RouteSetting = {
        method: string;
        url: string;
        requireAuth: boolean;
        selfOverride?: boolean;
        permissions: (keyof Omit<PermissionAttributes, "updated_by_user_id">)[];
    };

    namespace Express {
        interface Request {
            SqlConnection: Connection;
            routeSettings: RouteSetting;
        }
    }
}
