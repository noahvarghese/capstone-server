import * as request from "@middleware/request";
import dbConnection from "./db_connection";

export default Object.values({ ...request, dbConnection });
