import dotenv from "dotenv";
import Logs from "../../../src/util/logs/logs";
dotenv.config();

const { TARGET_ENV } = process.env;

let client: string = process.env[`ENV_${TARGET_ENV}_CLIENT`] ?? "";
let server: string = process.env[`ENV_${TARGET_ENV}_SERVER`] ?? "";

if (client !== "") {
    client = `http${TARGET_ENV !== "LOCAL" ? "s" : ""}://${client}/`;
} else {
    Logs.Error(`No client origin found for environment ${TARGET_ENV}`);
}

if (server !== "") {
    server = `http${TARGET_ENV !== "LOCAL" ? "s" : ""}://${server}/`;
} else {
    Logs.Error(`No server origin found for environment ${TARGET_ENV}`);
}

export { client, server };
