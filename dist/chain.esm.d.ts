export type Task = (previousResult: any, chain: Engine) => any;
export type Details = {
    taskIndex: number;
    error: Error | null;
    chain: Chain;
};
export class Chain {
    /** @type {Task[]} */
    tasks: Task[];
    /** @type {any}  */
    returnValue: any;
    /** @type {boolean} */
    completedSuccessfully: boolean;
    /** @type {boolean} */
    isRunning: boolean;
    /**
     * Adds an event listener to the chain
     * @param {"complete"|"cancel"|"error"|"run"} event
     * @param {(details:Details)=>void} listener
     * @returns {()=>void} unsubscribe function
     */
    on(event: "complete" | "cancel" | "error" | "run", listener: (details: Details) => void): () => void;
    /**
     * Adds a task to the chain
     * @param {Task} task
     * @returns {Chain} this
     */
    add(task: Task): Chain;
    /**
     * Runs the chain, if it is not already running
     * @param {{[key:string]:any}} [ctx] context object, passed to each task
     * @returns {Promise<any>} the result of the last task, if the chain completed successfully
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
    run(ctx?: {
        [key: string]: any;
    }): Promise<any>;
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
     * @returns {{[key:string]:any}}
     */
    getCtx(): {
        [key: string]: any;
    };
    #private;
}
/** @typedef {{taskIndex: number, error: Error|null, chain: Chain}} Details */
declare class Engine {
    /**
     * Creates an engine instance
     * @param {Chain} chain
     */
    constructor(chain: Chain);
    abortController: AbortController;
    chain: Chain;
    /**
     * Cancels the running chain, if it is running
     * @returns {void}
     * @throws {Error} with message "Cancel", if the chain is not running
     */
    cancel(): void;
    /**
     * Completes the running chain, if it is running
     * @param {*} [return_value] value to return as result of the chain
     * @throws {Error} with message "Complete", if the chain is not running
     */
    complete(return_value?: any): void;
    /**
     * Raises an error for the running chain, if it is running
     * @param {Error} error
     * @throws {Error} the given error
     */
    raiseError(error: Error): void;
    /**
     * Sleeps for the given amount of milliseconds. If the engine is cancelled during the sleep, the promise is resolved immediately.
     * @param {number} ms
     * @returns {Promise<void>}
     */
    sleep(ms: number): Promise<void>;
    /**
     * Wraps the global fetch function and adds the abort signal to the given options.
     * If the engine is cancelled during the fetch, the promise is resolved immediately.
     * @param {string} url
     * @param {RequestInit} [options]
     * @returns {Promise<Response>}
     */
    fetch(url: string, options?: RequestInit): Promise<Response>;
    /**
     * Wraps a function to ensure it respects the Engine's abort signal.
     * If the engine is cancelled during the execution of the function, the promise is rejected with an "Cancel" error.
     * @template {(...params:any[]) => Promise<any>} T
     * @param {T} fn - The function to wrap.
     * @returns {T} A new function that returns a promise, which resolves or rejects based on the original function's outcome or the abort signal.
     */
    wrap<T extends (...params: any[]) => Promise<any>>(fn: T): T;
    /**
     * Returns the context of the chain
     * @returns {{[key:string]:any}}
     */
    get ctx(): {
        [key: string]: any;
    };
}
export {};
//# sourceMappingURL=chain.esm.d.ts.map