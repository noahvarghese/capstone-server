/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require("dotenv");

dotenv.config();

let multiplier = process.env.TIMEOUT_MULTIPLIER;

try {
    multiplier = Number(multiplier);
} catch (_) {
    multiplier = 1;
}

console.debug(10000 * multiplier, multiplier);
jest.setTimeout(10000 * multiplier);