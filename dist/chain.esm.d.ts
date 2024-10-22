export type Task<U extends unknown, T extends {
    [key: string]: any;
}> = (previousResult: any, chainController: ChainController<U, T>) => any;
export type Details<U extends unknown, T extends {
    [key: string]: any;
}> = {
    lastTaskIndex: number;
    error: Error | null;
    chain: Chain<U, T>;
};
/**
 * @template {any} U return value
 * @template {{[key:string]:any}} T type of context
 */
export class Chain<U extends unknown, T extends {
    [key: string]: any;
}> {
    /**
     *
     * @param {T} [ctx]
     */
    constructor(ctx?: T);
    /** @type {Task<U,T>[]} */
    tasks: Task<U, T>[];
    /**
     * Adds an event listener to the chain
     * @param {"complete"|"cancel"|"error"|"run"} event
     * @param {(details:Details<U,T>)=>void} listener
     * @returns {()=>void} unsubscribe function
     */
    on(event: "complete" | "cancel" | "error" | "run", listener: (details: Details<U, T>) => void): () => void;
    /**
     * Adds a task to the chain
     * @param {Task<U,T>} task
     * @returns {Chain<U,T>} this
     */
    add(task: Task<U, T>): Chain<U, T>;
    /**
     * Runs the chain, if it is not already running
     * @param {T} [ctx] context object, passed to each task. If not provided, the context object of the last task will be used.
     * @returns {Promise<U|null>} the result of the last task, if the chain completed successfully
     * @throws {Error} with message "Already running", if the chain is already running
     * @throws {Error} with message "Cancel", if the chain is cancelled during the run
     * @throws {Error} with message "Complete", if the chain is completed during the run
     * @fires Chain#complete
     * @fires Chain#cancel
     * @fires Chain#error
     * @fires Chain#run
     * @listens Chain#complete
     * @listens Chain#cancel
     * @listens Chain#error
     * @listens Chain#run
     */
    run(ctx?: T): Promise<U | null>;
    /**
     * Waits until the chain is not running anymore. If the chain is not running, the function returns immediately.
     * @returns {Promise<void>}
     */
    waitForChainToFinish(): Promise<void>;
    /**
     * Cancels the running chain, if it is running
     * @returns {Promise<void>}
     * @throws {Error} with message "Cancel", if the chain is not running
     */
    cancel(): Promise<void>;
    /**
     * Returns the context of the chain
     * @returns {T}
     */
    get ctx(): T;
    /**
     * The return value of the last task in the chain, if the chain has completed successfully
     * @type {U|null}
     */
    get returnValue(): U;
    /**
     * Indicates whether the chain has completed successfully.
     */
    get completedSuccessfully(): boolean;
    /**
     * Whether the chain is currently running
     * @type {boolean}
     */
    get isRunning(): boolean;
    #private;
}
/**
 * @template {any} U
 * @template {{[key:string]:any}} T
 * @typedef {{lastTaskIndex: number, error: Error|null, chain: Chain<U,T>}} Details
 * */
/**
 * @template {any} U
 * @template {{[key:string]:any}} T
 */
declare class ChainController<U extends unknown, T extends {
    [key: string]: any;
}> {
    /**
     * Creates an chainController instance
     * @param {Chain<U,T>} chain
     */
    constructor(chain: Chain<U, T>);
    abortController: AbortController;
    chain: Chain<U, T>;
    /**
     * Checks if the abort signal is aborted and cancels the running chain if needed.
     * @returns {void}
     */
    checkAbortSignal(): void;
    /**
     * Cancels the running chain, if it is running
     * @returns {void}
     * @throws {Error} with message "Cancel", if the chain is not running
     */
    cancel(): void;
    /**
     * Completes the running chain, if it is running
     * @param {U} [return_value] value to return as result of the chain
     * @throws {Error} with message "Complete", if the chain is not running
     */
    complete(return_value?: U): void;
    /**
     * Sleeps for the given amount of milliseconds. If the chainController is cancelled during the sleep, the promise is resolved immediately.
     * @param {number} ms
     * @returns {Promise<void>}
     */
    sleep(ms: number): Promise<void>;
    /**
     * Wraps the global fetch function and adds the abort signal to the given options.
     * If the chainController is cancelled during the fetch, the promise is resolved immediately.
     * @param {string} url
     * @param {RequestInit} [options]
     * @returns {Promise<Response>}
     */
    fetch(url: string, options?: RequestInit): Promise<Response>;
    /**
     * Wraps a function to ensure it respects the ChainController's abort signal.
     * If the chainController is cancelled during the execution of the function, the promise is rejected with an "Cancel" error.
     * @template {(...params:any[]) => Promise<any>} Q
     * @param {Q} fn - The function to wrap.
     * @returns {Q} A new function that returns a promise, which resolves or rejects based on the original function's outcome or the abort signal.
     */
    wrap<Q extends (...params: any[]) => Promise<any>>(fn: Q): Q;
    /**
     * Returns the context of the chain
     * @returns {T}
     */
    get ctx(): T;
}
export {};
//# sourceMappingURL=chain.esm.d.ts.map