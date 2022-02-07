import Logs from "@noahvarghese/logger";

Logs.Log("Jest setup loaded");

const { TIMEOUT_MULTIPLIER } = process.env;

const DEFAULT_MULTIPLIER = 1;

const multiplier = isNaN(Number(TIMEOUT_MULTIPLIER))
    ? Number(TIMEOUT_MULTIPLIER)
    : DEFAULT_MULTIPLIER;

jest.setTimeout(10000 * multiplier);
