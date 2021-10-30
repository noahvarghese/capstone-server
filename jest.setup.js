/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require("dotenv");

dotenv.config();

const {
    TIMEOUT_MULTIPLIER
} = process.env;

const DEFAULT_MULTIPLIER = 1;

const multiplier = isNan(Number(TIMEOUT_MULTIPLIER)) ? Number(TIMEOUT_MULTIPLIER) : DEFAULT_MULTIPLIER;

jest.setTimeout(10000 * multiplier);