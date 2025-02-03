/**
 * Retry Utilities for handling transient failures
 * Provides configurable retry strategies with exponential backoff
 */

const { createComponentLogger, logError } = require('./logger');
const logger = createComponentLogger('retryUtils');

/**
 * Retry strategies
 */
const RetryStrategy = {
    EXPONENTIAL: 'exponential',
    LINEAR: 'linear',
    FIXED: 'fixed'
};

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG = {
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    baseDelay: parseInt(process.env.RETRY_BASE_DELAY || '1000'),
    maxDelay: parseInt(process.env.RETRY_MAX_DELAY || '15000'),
    strategy: RetryStrategy.EXPONENTIAL,
    retryableErrors: [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'NetworkError',
        'TimeoutError',
        'rate limit',
        'too many requests',
        '429',
        '503',
        '504'
    ]
};

/**
 * Classify an error into a predictable category for smart retry decisions
 * @param {Error} error - The error to classify
 * @returns {'quota' | 'timeout' | 'network' | 'unknown'}
 */
const classifyError = (error) => {
    if (!error) return 'unknown';

    const msg = (error.message || '').toLowerCase();
    const code = (error.code || '').toLowerCase();
    const status = error.response?.status || error.status || 0;

    // Quota / rate-limit errors — do NOT retry, costs quota
    if (status === 429 || msg.includes('429') || msg.includes('rate limit') ||
        msg.includes('too many requests') || msg.includes('quota')) {
        return 'quota';
    }

    // Auth errors — do NOT retry
    if (status === 401 || status === 403 || msg.includes('not configured') || msg.includes('api key')) {
        return 'auth';
    }

    // Timeout errors — retry once
    if (status === 504 || msg.includes('timeout') || msg.includes('timed out') ||
        code === 'etimedout' || msg.includes('etimedout')) {
        return 'timeout';
    }

    // Network unreachable — skip retry, go to fallback provider
    if (msg.includes('econnrefused') || msg.includes('enotfound') ||
        msg.includes('network') || msg.includes('econnreset') ||
        code === 'econnrefused' || code === 'enotfound') {
        return 'network';
    }

    return 'unknown';
};

/**
 * Check if an error is retryable
 * @param {Error} error - Error to check
 * @param {Array<string>} retryableErrors - List of retryable error patterns
 * @returns {boolean} - Whether the error is retryable
 */
const isRetryableError = (error, retryableErrors = DEFAULT_CONFIG.retryableErrors) => {
    if (!error) return false;

    const errorString = error.toString().toLowerCase();
    const errorCode = error.code?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';

    return retryableErrors.some(pattern => {
        const lowerPattern = pattern.toLowerCase();
        return errorString.includes(lowerPattern) ||
            errorCode.includes(lowerPattern) ||
            errorMessage.includes(lowerPattern);
    });
};

/**
 * Calculate delay based on retry strategy
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {Object} config - Retry configuration
 * @returns {number} - Delay in milliseconds
 */
const calculateDelay = (attempt, config) => {
    const { strategy, baseDelay, maxDelay } = config;

    let delay;
    switch (strategy) {
        case RetryStrategy.EXPONENTIAL:
            delay = baseDelay * Math.pow(2, attempt);
            break;
        case RetryStrategy.LINEAR:
            delay = baseDelay * (attempt + 1);
            break;
        case RetryStrategy.FIXED:
        default:
            delay = baseDelay;
    }

    return Math.min(delay, maxDelay);
};

/**
 * Sleep for specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function with configurable strategy
 * @param {Function} fn - Async function to retry
 * @param {Object} config - Retry configuration
 * @param {string} operationName - Name of operation for logging
 * @returns {Promise<any>} - Result of the function
 */
const retryWithBackoff = async (fn, config = {}, operationName = 'operation') => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const { maxRetries, retryableErrors } = finalConfig;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            logger.debug(`Attempting ${operationName}`, {
                attempt: attempt + 1,
                maxRetries: maxRetries + 1,
                operationName
            });

            const result = await fn();

            if (attempt > 0) {
                logger.info(`${operationName} succeeded after retry`, {
                    attempt: attempt + 1,
                    operationName
                });
            }

            return result;
        } catch (error) {
            lastError = error;

            const errorClass = classifyError(error);

            // --- Smart retry decisions ---
            // 429 quota or auth: never retry — fail immediately
            if (errorClass === 'quota' || errorClass === 'auth') {
                logger.warn(`${operationName} failed permanently (${errorClass}) — not retrying`, {
                    attempt: attempt + 1,
                    operationName,
                    error: error.message,
                    errorClass
                });
                throw error;
            }

            // Network unreachable: skip retries — go to fallback provider
            if (errorClass === 'network') {
                logger.warn(`${operationName} network unreachable — skipping retries, falling back`, {
                    attempt: attempt + 1,
                    operationName,
                    error: error.message,
                    errorClass
                });
                throw error;
            }

            // Timeout: allow exactly 1 retry
            if (errorClass === 'timeout' && attempt >= 1) {
                logger.error(`${operationName} timed out — max 1 retry exhausted`, {
                    attempt: attempt + 1,
                    operationName,
                    error: error.message,
                    errorClass
                });
                throw error;
            }

            const isRetryable = isRetryableError(error, retryableErrors);
            const isLastAttempt = attempt === maxRetries;

            if (!isRetryable || isLastAttempt) {
                logger.error(`${operationName} failed`, {
                    attempt: attempt + 1,
                    maxRetries: maxRetries + 1,
                    isRetryable,
                    isLastAttempt,
                    error: error.message,
                    operationName
                });
                throw error;
            }

            const delay = calculateDelay(attempt, finalConfig);

            logger.warn(`${operationName} failed, retrying`, {
                attempt: attempt + 1,
                maxRetries: maxRetries + 1,
                delay,
                error: error.message,
                operationName
            });

            await sleep(delay);
        }
    }

    throw lastError;
};

/**
 * Retry with timeout
 * @param {Function} fn - Async function to retry
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {Object} config - Retry configuration
 * @param {string} operationName - Operation name
 * @returns {Promise<any>} - Result of the function
 */
const retryWithTimeout = async (fn, timeoutMs, config = {}, operationName = 'operation') => {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    const retryPromise = retryWithBackoff(fn, config, operationName);

    return Promise.race([retryPromise, timeoutPromise]);
};

/**
 * Create a circuit breaker
 * @param {Function} fn - Function to protect with circuit breaker
 * @param {Object} options - Circuit breaker options
 * @returns {Function} - Wrapped function with circuit breaker
 */
const createCircuitBreaker = (fn, options = {}) => {
    const {
        failureThreshold = 5,
        resetTimeout = 60000, // 1 minute
        operationName = 'operation'
    } = options;

    let failureCount = 0;
    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    let nextAttempt = Date.now();

    return async (...args) => {
        if (state === 'OPEN') {
            if (Date.now() < nextAttempt) {
                throw new Error(`Circuit breaker is OPEN for ${operationName}. Try again later.`);
            }
            state = 'HALF_OPEN';
            logger.info(`Circuit breaker transitioning to HALF_OPEN`, { operationName });
        }

        try {
            const result = await fn(...args);

            if (state === 'HALF_OPEN') {
                state = 'CLOSED';
                failureCount = 0;
                logger.info(`Circuit breaker CLOSED`, { operationName });
            }

            return result;
        } catch (error) {
            failureCount++;

            if (failureCount >= failureThreshold) {
                state = 'OPEN';
                nextAttempt = Date.now() + resetTimeout;
                logger.error(`Circuit breaker OPEN`, {
                    operationName,
                    failureCount,
                    resetTimeout,
                    nextAttempt: new Date(nextAttempt).toISOString()
                });
            }

            throw error;
        }
    };
};

module.exports = {
    retryWithBackoff,
    retryWithTimeout,
    isRetryableError,
    classifyError,
    createCircuitBreaker,
    RetryStrategy,
    DEFAULT_CONFIG
};
