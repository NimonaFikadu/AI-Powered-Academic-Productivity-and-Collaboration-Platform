/**
 * Structured Logger for UniHub Application
 * Uses Winston for consistent, searchable logging across all services
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// Define colors for console output
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
};

winston.addColors(colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, component, ...meta }) => {
        const componentStr = component ? `[${component}]` : '';
        const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} ${level} ${componentStr} ${message}${metaStr}`;
    })
);

// Custom format for file output
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create transports array
const transports = [];

// Always add console transport
transports.push(
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env.LOG_LEVEL || 'info'
    })
);

// Add file transports if enabled
if (process.env.LOG_TO_FILE === 'true') {
    const logDir = process.env.LOG_DIR || 'logs';

    // Error log file
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: parseInt(process.env.LOG_MAX_FILES || '7')
        })
    );

    // Combined log file
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: parseInt(process.env.LOG_MAX_FILES || '7')
        })
    );
}

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    transports,
    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.Console({ format: consoleFormat })
    ],
    rejectionHandlers: [
        new winston.transports.Console({ format: consoleFormat })
    ]
});

/**
 * Create a child logger with a specific component name
 * @param {string} component - Component name (e.g., 'vectorStore', 'noteGenerator')
 * @returns {Object} - Child logger with component context
 */
const createComponentLogger = (component) => {
    return {
        error: (message, meta = {}) => logger.error(message, { component, ...meta }),
        warn: (message, meta = {}) => logger.warn(message, { component, ...meta }),
        info: (message, meta = {}) => logger.info(message, { component, ...meta }),
        debug: (message, meta = {}) => logger.debug(message, { component, ...meta })
    };
};

/**
 * Log the start of an operation with timing
 * @param {string} component - Component name
 * @param {string} operation - Operation name
 * @param {Object} meta - Additional metadata
 * @returns {Function} - Function to call when operation completes
 */
const logOperation = (component, operation, meta = {}) => {
    const startTime = Date.now();
    const operationId = `${component}_${operation}_${startTime}`;

    logger.info(`Starting operation: ${operation}`, {
        component,
        operation,
        operationId,
        ...meta
    });

    return (success = true, resultMeta = {}) => {
        const duration = Date.now() - startTime;
        const level = success ? 'info' : 'error';
        const message = success
            ? `Operation completed: ${operation}`
            : `Operation failed: ${operation}`;

        logger.log(level, message, {
            component,
            operation,
            operationId,
            duration,
            durationMs: duration,
            success,
            ...meta,
            ...resultMeta
        });
    };
};

/**
 * Log an error with full context
 * @param {string} component - Component name
 * @param {string} message - Error message
 * @param {Error} error - Error object
 * @param {Object} meta - Additional metadata
 */
const logError = (component, message, error, meta = {}) => {
    logger.error(message, {
        component,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error.response && { response: error.response.data })
        },
        ...meta
    });
};

/**
 * Log a structured AI provider error
 * @param {Object} params - Error parameters
 * @param {string} params.provider - AI provider name ('gemini' | 'openrouter')
 * @param {string} params.userId - User ID making the request
 * @param {string} params.endpoint - API endpoint being called ('/rag/chat' | '/rag/notes' | '/rag/quiz')
 * @param {string} params.errorType - Error classification ('quota' | 'timeout' | 'network' | 'unknown')
 * @param {string} params.message - Actual error message
 */
const logAiError = ({ provider, userId, endpoint, errorType, message }) => {
    logger.error('[AI_ERROR]', {
        provider,
        user_id: userId,
        endpoint,
        error_type: errorType,
        message
    });
};

module.exports = {
    logger,
    createComponentLogger,
    logOperation,
    logError,
    logAiError
};
