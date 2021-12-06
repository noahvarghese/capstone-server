import { Connection } from "typeorm";
import { PermissionAttributes } from "@models/permission";

declare global {
    type RouteSetting = {
        method: string;
        url: string;
        requireParam: boolean;
        requireAuth: boolean;
        permissions: (keyof Omit<PermissionAttributes, "updated_by_user_id">)[];
    };

    namespace Express {
        interface Request {
            SqlConnection: Connection;
            routeSettings: RouteSetting;
        }
    }
}
