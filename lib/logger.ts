/**
 * Structured Logger for SPENDLY
 * Replaces console.log with proper log levels and JSON formatting
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';
type LogData = Record<string, unknown>;

const LOG_LEVELS: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const currentLevel = (): number => {
    const level = (process.env.LOG_LEVEL as LogLevel) || 'info';
    return LOG_LEVELS[level] ?? LOG_LEVELS.info;
};

const formatLog = (level: LogLevel, msg: string, data?: LogData): string => {
    return JSON.stringify({
        level,
        msg,
        ts: new Date().toISOString(),
        ...data
    });
};

export const logger = {
    error: (msg: string, data?: LogData): void => {
        if (currentLevel() >= LOG_LEVELS.error) {
            console.error(formatLog('error', msg, data));
        }
    },

    warn: (msg: string, data?: LogData): void => {
        if (currentLevel() >= LOG_LEVELS.warn) {
            console.warn(formatLog('warn', msg, data));
        }
    },

    info: (msg: string, data?: LogData): void => {
        if (currentLevel() >= LOG_LEVELS.info) {
            console.info(formatLog('info', msg, data));
        }
    },

    debug: (msg: string, data?: LogData): void => {
        if (currentLevel() >= LOG_LEVELS.debug) {
            console.log(formatLog('debug', msg, data));
        }
    },
};

export default logger;
