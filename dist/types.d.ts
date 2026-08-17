/**
 * Task function that receives the previous result and a chain controller.
 */
export type Task<U = any, T extends Record<string, any> = Record<string, any>> = (
    previousResult: any,
    chainController: ChainController<U, T>
) => any;

/**
 * Details object passed to event listeners.
 */
export interface Details<U = any, T extends Record<string, any> = Record<string, any>> {
    chain: Chain<U, T>;
    lastTaskIndex: number;
    error: Error | null;
}
/* From Chain.d.ts */
/**
 * @template {any} U
 * @template {{[key: string]: any}} [T={}]
 */
export class Chain<U extends unknown, T extends {
    [key: string]: any;
} = {}> {
    /**
     * @param {T} [ctx] - initial context
     * @param {{ signal?: AbortSignal }} [options]
     */
    constructor(ctx?: T, options?: {
        signal?: AbortSignal;
    });
    /**
     * Adds an event listener.
     * @param {'complete'|'cancel'|'error'|'run'|'fail'} event
     * @param {(details: { chain: Chain<U,T>, lastTaskIndex: number, error: Error | null }) => void} listener
     * @returns {() => void} unsubscribe function
     */
    on(event: "complete" | "cancel" | "error" | "run" | "fail", listener: (details: {
        chain: Chain<U, T>;
        lastTaskIndex: number;
        error: Error | null;
    }) => void): () => void;
    /**
     * Adds a task to the chain.
     * @param {(previousResult: any, chainController: ChainController<U,T>) => any} task
     * @returns {this}
     */
    add(task: (previousResult: any, chainController: ChainController<U, T>) => any): this;
    /**
     * Runs the chain.
     * @param {*} [initValue]
     * @returns {Promise<U|null>}
     * @throws {AlreadyRunningError} if the chain is already running
     */
    run(initValue?: any): Promise<U | null>;
    /**
     * Waits for the chain to finish.
     * @returns {Promise<void>}
     */
    waitForChainToFinish(): Promise<void>;
    /**
     * Cancels the running chain.
     * @returns {Promise<void>}
     */
    cancel(): Promise<void>;
    /** Returns the chain's context. */
    get ctx(): T;
    /** Returns the final result if completed successfully, else null. */
    get returnValue(): U | null;
    /** Whether the chain completed successfully. */
    get completedSuccessfully(): boolean;
    /** Whether the chain is currently running. */
    get isRunning(): boolean;

}

/* From ChainController.d.ts */
/**
 * @template {any} U
 * @template {{[key: string]: any}} T
 */
export class ChainController<U extends unknown, T extends {
    [key: string]: any;
}> {
    /**
     * @param {Chain<U,T>} chain
     * @param {AbortSignal} [externalSignal]
     */
    constructor(chain: Chain<U, T>, externalSignal?: AbortSignal);
    chain: Chain<U, T>;
    abortController: AbortController;
    /**
     * Throws a CancelError if the signal has been aborted.
     * @throws {CancelError}
     */
    checkAbortSignal(): void;
    /** Throws a CancelError to cancel the chain. */
    cancel(): void;
    /**
     * Throws a CompleteError to finish the chain early.
     * @param {U} [returnValue]
     * @throws {CompleteError}
     */
    complete(returnValue?: U): void;
    /**
     * Sleeps for the given milliseconds, abortable.
     * @param {number} ms
     * @returns {Promise<void>}
     */
    sleep(ms: number): Promise<void>;
    /**
     * Wraps fetch with the abort signal.
     * @param {string} url
     * @param {RequestInit} [options]
     * @returns {Promise<Response>}
     */
    fetch(url: string, options?: RequestInit): Promise<Response>;
    /**
     * Wraps an async function to respect the abort signal.
     * @template {(...args: any[]) => Promise<any>} Fn
     * @param {Fn} fn
     * @returns {Fn}
     */
    wrap<Fn extends (...args: any[]) => Promise<any>>(fn: Fn): Fn;
    /** Returns the chain's context. */
    get ctx(): T;
}

/* From errors.d.ts */
/**
 * Error thrown when the chain is cancelled.
 */
export class CancelError extends Error {
    constructor();
}
/**
 * Error thrown when the chain is completed early.
 */
export class CompleteError extends Error {
    /**
     * @param {any} returnValue - value to return as the chain result
     */
    constructor(returnValue: any);
    returnValue: any;
}
/**
 * Error thrown when attempting to run an already running chain.
 */
export class AlreadyRunningError extends Error {
    constructor();
}

/* From utils.d.ts */
/**
 * Sleeps for the given milliseconds. If a signal is provided, aborts on signal.
 * @param {number} ms
 * @param {AbortSignal} [signal] - optional abort signal
 * @returns {Promise<void>}
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void>;
/**
 * Wraps an async function to respect the abort signal.
 * @template {(...args: any[]) => Promise<any>} Fn
 * @param {Fn} fn
 * @param {AbortSignal} signal
 * @returns {Fn}
 */
export function wrap<Fn extends (...args: any[]) => Promise<any>>(fn: Fn, signal: AbortSignal): Fn;
