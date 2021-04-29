import dotenv from "dotenv";
import Logs, { LogLevels } from "./logs";
dotenv.config();

const { TARGET_ENV } = process.env;

let client: string = process.env[`ENV_${TARGET_ENV}_CLIENT`] ?? "";
let server: string = process.env[`ENV_${TARGET_ENV}_SERVER`] ?? "";

if (client !== "") {
    client = `http${TARGET_ENV !== "LOCAL" ? "s" : ""}://${client}/`;
} else {
    Logs.addLog(
        `No client origin found for environment ${TARGET_ENV}`,
        LogLevels.ERROR
    );
}

if (server !== "") {
    server = `http${TARGET_ENV !== "LOCAL" ? "s" : ""}://${server}/`;
} else {
    Logs.addLog(
        `No server origin found for environment ${TARGET_ENV}`,
        LogLevels.ERROR
    );
}

export { client, server };
