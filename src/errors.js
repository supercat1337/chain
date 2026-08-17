// @ts-check

/**
 * Error thrown when the chain is cancelled.
 */
export class CancelError extends Error {
    constructor() {
        super('Cancel');
        this.name = 'CancelError';
    }
}

/**
 * Error thrown when the chain is completed early.
 */
export class CompleteError extends Error {
    /**
     * @param {any} returnValue - value to return as the chain result
     */
    constructor(returnValue) {
        super('Complete');
        this.name = 'CompleteError';
        this.returnValue = returnValue;
    }
}

/**
 * Error thrown when attempting to run an already running chain.
 */
export class AlreadyRunningError extends Error {
    constructor() {
        super('Already running');
        this.name = 'AlreadyRunningError';
    }
}
