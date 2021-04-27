// tslint:disable: no-console
import dotenv from "dotenv";
dotenv.config();

export enum LogLevels {
    EVENT = 0,
    ERROR = 1,
    WARN = 2,
    DEBUG = 3,
    LOG = 4,
    SQL = 6,
    METRICS = 5,
}

interface LogData {
    prefix: string;
    consoleFunction: (prefix: string, message: string) => void;
}

const emptyLogData = (): LogData => ({
    prefix: "",
    // tslint:disable-next-line: no-empty
    consoleFunction: (): void => {},
});

const createLogData = <T extends Partial<LogData>>(
    intialValues: T
): LogData & T => {
    return Object.assign(emptyLogData(), intialValues);
};

export default class Logs {
    static logLevel: LogLevels = Number(process.env.LOG_LEVEL!);

    private static getLogData = (logLevel: LogLevels): LogData => {
        switch (logLevel) {
            case LogLevels.EVENT:
                return createLogData({
                    prefix: "[ EVENT ]: ",
                    consoleFunction: console.log,
                });
            case LogLevels.ERROR:
                return createLogData({
                    prefix: "[ ERROR ]: ",
                    consoleFunction: console.error,
                });
            case LogLevels.WARN:
                return createLogData({
                    prefix: "[ WARNING ]: ",
                    consoleFunction: console.warn,
                });
            case LogLevels.DEBUG:
                return createLogData({
                    prefix: "[ DEBUG ]: ",
                    consoleFunction: console.debug,
                });
            case LogLevels.LOG:
                return createLogData({
                    prefix: "[ LOG ]: ",
                    consoleFunction: console.log,
                });
            case LogLevels.SQL:
                return createLogData({
                    prefix: "[ SQL ]: ",
                    consoleFunction: console.info,
                });
            case LogLevels.METRICS:
                return createLogData({
                    prefix: "[ METRICS ]: ",
                    consoleFunction: console.info,
                });
            default:
                throw new Error(
                    "Log level passed in does match log levels set."
                );
        }
    };

    static addLog = (message: any | any, logLevel: LogLevels) => {
        if (logLevel <= Logs.logLevel) {
            try {
                const { prefix, consoleFunction }: LogData = Logs.getLogData(
                    logLevel
                );

                consoleFunction(prefix, message);
            } catch (e) {
                console.error(e.message);
            }
        }
    };
}
