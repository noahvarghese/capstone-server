import { authenticated } from "./authenticated";
import { authorized } from "./authorized";
import { dbConnection } from "./db_connection";
import * as request from "./request";
import { routeSettings } from "./route_settings";

export default Object.values({
    // request needs to be first always
    ...request,
    dbConnection,
    routeSettings,
    authenticated,
    authorized,
});
