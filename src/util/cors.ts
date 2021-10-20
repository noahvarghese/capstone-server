import cors from "cors";
import { client } from "./permalink";

let origin = client();

if (origin[origin.length - 1] === "/") {
    origin = origin.substring(0, origin.length - 1);
}

const corsOptions = {
    origin: [origin, origin + "/"],
    credentials: true,
    // Need to check why I enabled this
    // Leaving for now
    exposedHeaders: ["set-cookie"],
};

export default cors(corsOptions);
