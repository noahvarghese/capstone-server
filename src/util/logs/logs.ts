// tslint:disable: no-console
import dotenv from "dotenv";
dotenv.config();

enum LogLevels {
    TEST = 0,
    EVENT = 1,
    ERROR = 2,
    WARN = 3,
    DEBUG = 4,
    LOG = 5,
    METRICS = 6,
    SQL = 7,
}

interface LogData {
    prefix: string;
    consoleFunction: (prefix: string, ...args: unknown[]) => void;
}

const emptyLogData = (): LogData => ({
    prefix: "",
    consoleFunction: function (): void {
        return;
    },
});

const createLogData = <T extends Partial<LogData>>(
    intialValues: T
): LogData & T => {
    return Object.assign(emptyLogData(), intialValues);
};

const LogDataTypes = {
    [LogLevels.TEST]: createLogData({
        prefix: "[ TEST ]: ",
        consoleFunction: console.log,
    }),
    [LogLevels.EVENT]: createLogData({
        prefix: "[ EVENT ]: ",
        consoleFunction: console.log,
    }),
    [LogLevels.ERROR]: createLogData({
        prefix: "[ ERROR ]: ",
        consoleFunction: console.error,
    }),
    [LogLevels.WARN]: createLogData({
        prefix: "[ WARNING ]: ",
        consoleFunction: console.warn,
    }),
    [LogLevels.DEBUG]: createLogData({
        prefix: "[ DEBUG ]: ",
        consoleFunction: console.log,
    }),
    [LogLevels.LOG]: createLogData({
        prefix: "[ LOG ]: ",
        consoleFunction: console.error,
    }),
    [LogLevels.SQL]: createLogData({
        prefix: "[ SQL ]: ",
        consoleFunction: console.warn,
    }),
    [LogLevels.METRICS]: createLogData({
        prefix: "[ METRICS ]: ",
        consoleFunction: console.warn,
    }),
};

export default class Logs {
    static logLevel: LogLevels = Number(process.env.LOG_LEVEL) ?? Infinity;

    public static configureLogs = (disableLogs: boolean): void => {
        if (disableLogs) {
            Logs.logLevel = 0;
        } else {
            Logs.logLevel = Number(process.env.LOG_LEVEL) ?? Infinity;
        }
    };

    private static getLogData = (logLevel: LogLevels): LogData => {
        return LogDataTypes[logLevel] ?? emptyLogData();
    };

    private static add = (logLevel: LogLevels, ...args: unknown[]): void => {
        if (logLevel <= Logs.logLevel) {
            try {
                const { prefix, consoleFunction }: LogData =
                    Logs.getLogData(logLevel);
                consoleFunction(prefix, ...args);
            } catch (e) {
                if (e instanceof Error) console.error(e.message);
                else console.error(JSON.stringify(e));
            }
        }
    };

    static Test(...args: unknown[]): void {
        Logs.add(LogLevels.TEST, ...args);
    }

    static Event(...args: unknown[]): void {
        Logs.add(LogLevels.EVENT, ...args);
    }

    static Error(...args: unknown[]): void {
        Logs.add(LogLevels.ERROR, ...args);
    }

    static Warning(...args: unknown[]): void {
        Logs.add(LogLevels.WARN, ...args);
    }

    static Debug(...args: unknown[]): void {
        Logs.add(LogLevels.DEBUG, ...args);
    }

    static Log(...args: unknown[]): void {
        Logs.add(LogLevels.LOG, ...args);
    }

    static SQL(...args: unknown[]): void {
        Logs.add(LogLevels.SQL, ...args);
    }

    static Metric(...args: unknown[]): void {
        Logs.add(LogLevels.METRICS, ...args);
    }
}
