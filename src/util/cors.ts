import cors from "cors";
import { client as origin } from "./permalink";

const corsOptions = {
    origin,
    credentials: true,
    // Need to check why I enabled this
    // Leaving for now
    exposedHeaders: ["set-cookie"],
};

export default cors(corsOptions);
