const fs = require("fs");
const {
    exit
} = require("process");
const api = require("../../api_spec.json");

const checkCustomFormat = (paths) => {
    for (const route of Object.keys(paths)) {
        const methods = Object.keys(paths[route]).filter((m) => m !== "parameters" && m !== "description");
        for (const method of methods) {
            if (paths[route][method].details === undefined) {
                throw new Error(`${method.toUpperCase()} ${route} is missing details`);
            }
        }
    }
}

const genDefaultFormat = (api) => {
    for (const route of Object.keys(api.paths)) {
        for (const method of Object.keys(api.paths[route])) {
            if (["parameters", "description"].includes(method) === false) {
                delete api.paths[route][method].details;
            }
        }
    }
}

const saveDefaultFormat = async (name, api) => {
    return await new Promise((res) => {
        fs.writeFile(name, JSON.stringify(api), res);
    });
}

const main = async (api) => {
    try {
        checkCustomFormat(api.paths);
    } catch (e) {
        console.error("[ ERROR ]:", e.message);
        exit(1);
    }

    // Changes object in place
    genDefaultFormat(api);

    await saveDefaultFormat("api.json", api);
}

(async () => {
    await main(api);
})();