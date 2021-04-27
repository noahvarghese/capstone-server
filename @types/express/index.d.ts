import { Connection } from "typeorm";

declare global {
    namespace Express {
        interface Request {
            SqlConnection: Connection;
        }
    }
}
