import dotenv from "dotenv";
dotenv.config();

const { TARGET_ENV } = process.env;

let clientURL: string = process.env[`ENV_${TARGET_ENV}_CLIENT`] ?? "";
let serverURL: string = process.env[`ENV_${TARGET_ENV}_SERVER`] ?? "";

if (clientURL === "") {
    throw new Error(`No client origin found for environment ${TARGET_ENV}`);
}

if (serverURL === "") {
    throw new Error(`No server origin found for environment ${TARGET_ENV}`);
}

clientURL = `http${TARGET_ENV !== "LOCAL" ? "s" : ""}://${clientURL}/`;
serverURL = `http${TARGET_ENV !== "LOCAL" ? "s" : ""}://${serverURL}/`;

export const client = (path = ""): string =>
    clientURL + (path[0] === "/" ? path.substring(1) : path);
export const server = (path = ""): string =>
    serverURL + (path[0] === "/" ? path.substring(1) : path);
