import dotenv from "dotenv";
import Logs, { LogLevels } from "./logs";
dotenv.config();

const targetEnv = process.env.TARGET_ENV ?? "";

const client = process.env[`ENV_${targetEnv}_CLIENT`] ?? "";
const server = process.env[`ENV_${targetEnv}_SERVER`] ?? "";

if (client === "") {
    Logs.addLog(
        `No client origin found for environment ${targetEnv}`,
        LogLevels.ERROR
    );
}

if (server === "") {
    Logs.addLog(
        `No server origin found for environment ${targetEnv}`,
        LogLevels.ERROR
    );
}

export { client, server };
