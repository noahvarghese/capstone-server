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
    consoleFunction: (
        prefix: string,
        message: string | unknown,
        ...optionalParams: unknown[]
    ) => void;
}

const emptyLogData = (): LogData => ({
    prefix: "",
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    consoleFunction: (): void => {},
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
        }
    };

    private static getLogData = (logLevel: LogLevels): LogData => {
        return LogDataTypes[logLevel] ?? emptyLogData();
    };

    private static add = (
        logLevel: LogLevels,
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        if (logLevel <= Logs.logLevel) {
            try {
                const { prefix, consoleFunction }: LogData = Logs.getLogData(
                    logLevel
                );

                if (optionalParams.length > 1 || optionalParams[0]) {
                    consoleFunction(
                        prefix,
                        typeof message !== "string"
                            ? JSON.stringify(message)
                            : message,
                        ...optionalParams
                    );
                } else {
                    consoleFunction(
                        prefix,
                        typeof message !== "string"
                            ? JSON.stringify(message)
                            : message
                    );
                }
            } catch (e) {
                console.error(e.message);
            }
        }
    };

    static Test = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(
            LogLevels.TEST,
            message,
            optionalParams.length > 0 ? optionalParams : undefined
        );
    };

    static Event = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(
            LogLevels.EVENT,
            message,
            optionalParams.length > 0 ? optionalParams : undefined
        );
    };

    static Error = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(
            LogLevels.ERROR,
            message,
            optionalParams.length > 0 ? optionalParams : undefined
        );
    };

    static Warning = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(
            LogLevels.WARN,
            message,
            optionalParams.length > 0 ? optionalParams : undefined
        );
    };

    static Debug = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(
            LogLevels.DEBUG,
            message,
            optionalParams.length > 0 ? optionalParams : undefined
        );
    };

    static Log = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(
            LogLevels.LOG,
            message,
            optionalParams.length > 0 ? optionalParams : undefined
        );
    };

    static SQL = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(
            LogLevels.SQL,
            message,
            optionalParams.length > 0 ? optionalParams : undefined
        );
    };

    static Metric = (
        message?: string | unknown,
        ...optionalParams: unknown[]
    ): void => {
        Logs.add(
            LogLevels.METRICS,
            message,
            optionalParams.length > 0 ? optionalParams : undefined
        );
    };
}
