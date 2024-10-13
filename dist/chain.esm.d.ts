export type Task = (previousResult: any, chain: Engine) => any;
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
     * @param {(event:any)=>any} listener
     * @returns {Function} unsubscribe function
     */
    on(event: "complete" | "cancel" | "error" | "run", listener: (event: any) => any): Function;
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
    waitUntilComplete(): Promise<void>;
    /**
     * Cancels the running chain, if it is running
     * @returns {void}
     * @throws {Error} with message "Cancel", if the chain is not running
     */
    cancel(): void;
    /**
     * Returns the context of the chain
     * @returns {{[key:string]:any}}
     */
    getCtx(): {
        [key: string]: any;
    };
    #private;
}
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
     * Returns the context of the chain
     * @returns {{[key:string]:any}}
     */
    get ctx(): {
        [key: string]: any;
    };
}
export {};
//# sourceMappingURL=chain.esm.d.ts.map