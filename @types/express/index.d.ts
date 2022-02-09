import { Connection } from "typeorm";

declare global {
    namespace Express {
        interface Request {
            routeSettings: RouteSettings;
            dbConnection: Connection;
        }
    }
}
