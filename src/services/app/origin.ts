import cors from "cors";
import { client } from "@util/permalink";
import Logs from "@util/logs/logs";

let origin = client();

if (origin[origin.length - 1] === "/") {
    origin = origin.substring(0, origin.length - 1);
}

Logs.Debug(origin, origin + "/");

const corsOptions = {
    origin: [origin, origin + "/"],
    credentials: true,
    // Need to check why I enabled this
    // Leaving for now
    exposedHeaders: ["set-cookie"],
};

export default cors(corsOptions);
