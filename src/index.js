// @ts-check

import { EventEmitter } from "@supercat1337/event-emitter";

/** 
 * @template {any} U
 * @template {{[key:string]:any}} T 
 * @typedef {(previousResult:any, chainController:ChainController<U,T>)=>any} Task */

/**
 * Sleeps for the given amount of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
class ChainController {

    abortController = new AbortController;

    /**
     * Creates an chainController instance
     * @param {Chain<U,T>} chain
     */
    constructor(chain) {
        this.chain = chain;
    }

    /**
     * Checks if the abort signal is aborted and cancels the running chain if needed.
     * @returns {void}
     */
    checkAbortSignal() {
        if (this.abortController.signal.aborted) {
            this.cancel();
        }
    }

    /**
     * Cancels the running chain, if it is running
     * @returns {void}
     * @throws {Error} with message "Cancel", if the chain is not running
     */
    cancel() {
        let error = new Error("Cancel");
        throw error;
    }

    /**
     * Completes the running chain, if it is running
     * @param {U} [return_value] value to return as result of the chain
     * @throws {Error} with message "Complete", if the chain is not running
     */
    complete(return_value) {
        this.checkAbortSignal();

        let error = new Error("Complete", { cause: return_value });
        throw error;
    }

    /**
     * Sleeps for the given amount of milliseconds. If the chainController is cancelled during the sleep, the promise is resolved immediately.
     * @param {number} ms
     * @returns {Promise<void>}
     */
    sleep(ms) {
        this.checkAbortSignal();

        return new Promise((resolve, reject) => {

            const callback = () => {
                clearTimeout(timeout_id);
                reject(new Error("Cancel"));
            };

            let timeout_id = setTimeout(() => {
                this.abortController.signal.removeEventListener("abort", callback);
                resolve();
            }, ms);

            this.abortController.signal.addEventListener("abort", callback);
        });
    }

    /**
     * Wraps the global fetch function and adds the abort signal to the given options.
     * If the chainController is cancelled during the fetch, the promise is resolved immediately.
     * @param {string} url
     * @param {RequestInit} [options]
     * @returns {Promise<Response>}
     */
    fetch(url, options) {
        this.checkAbortSignal();

        return fetch(url, Object.assign({}, options, { signal: this.abortController.signal }));
    }

    /**
     * Wraps a function to ensure it respects the ChainController's abort signal.
     * If the chainController is cancelled during the execution of the function, the promise is rejected with an "Cancel" error.
     * @template {(...params:any[]) => Promise<any>} Q
     * @param {Q} fn - The function to wrap.
     * @returns {Q} A new function that returns a promise, which resolves or rejects based on the original function's outcome or the abort signal.
     */
    wrap(fn) {
        this.checkAbortSignal();

        const that = this;
        const func = function (...params) {
            return new Promise((resolve, reject) => {
                const callback = () => {
                    reject(new Error("Cancel"));
                }

                that.abortController.signal.addEventListener("abort", callback);

                fn(...params).then((res) => {
                    that.abortController.signal.removeEventListener("abort", callback);
                    resolve(res);
                }).catch(reject);

            });
        };

        return /** @type {Q} */ (func);
    }

    /**
     * Returns the context of the chain
     * @returns {T}
     */
    get ctx() {
        return this.chain.ctx;
    }
}

/**
 * @template {any} U return value
 * @template {{[key:string]:any}} T type of context
 */
export class Chain {

    /** @type {EventEmitter<"complete"|"cancel"|"error"|"run">} */
    #eventEmitter = new EventEmitter();

    /** @type {Task<U,T>[]} */
    tasks = [];

    /** @type {null|U}  */
    #returnValue;

    /** @type {boolean} */
    #completedSuccessfully = false;

    /** @type {boolean} */
    #isRunning = false;

    /** @type {T} */
    #ctx = /** @type {T} */ ({});

    /** @type {ChainController<U,T>} */
    #chainController = new ChainController(this);

    /**
     * 
     * @param {T} [ctx] 
     */
    constructor(ctx) {
        if (ctx) {
            this.#ctx = ctx;
        }
     }

    /**
     * Adds an event listener to the chain
     * @param {"complete"|"cancel"|"error"|"run"} event
     * @param {(details:Details<U,T>)=>void} listener
     * @returns {()=>void} unsubscribe function
     */
    on(event, listener) {
        return this.#eventEmitter.on(event, listener);
    }

    /**
     * Adds a task to the chain
     * @param {Task<U,T>} task
     * @returns {Chain<U,T>} this
     */
    add(task) {
        this.tasks.push(task);
        return this;
    }

    /**
     * 
     * @param {"complete"|"cancel"|"error"|"run"} event
     * @param {Details<U,T>} details
     * 
     */
    #emit(event, details) {
        this.#eventEmitter.emit(event, details);
    }

    /**
     * Runs the chain, if it is not already running
     * @param {*} [initValue] initial value
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
    async run(initValue, ctx) {

        if (this.#isRunning) {

            this.#emit("error", {
                chain: this,
                error: new Error("Already running"),
                lastTaskIndex: -1,
            });

            return null;
        }

        this.#chainController = new ChainController(this);

        this.#isRunning = true;
        var previousResult = initValue;

        this.#completedSuccessfully = false;
        this.#returnValue = null;

        if (ctx) {
            this.#ctx = ctx;
        }

        this.#emit("run", {
            chain: this,
            lastTaskIndex: -1,
            error: null,
        });


        var i = -1;

        if (this.tasks.length > 0) {
            i = 0;

            while (this.tasks[i]) {

                try {
                    this.#chainController.checkAbortSignal();
                    previousResult = await this.tasks[i](previousResult, this.#chainController);
                }
                catch (e) {
                    if (!this.#chainController.abortController.signal.aborted) {
                        this.#chainController.abortController.abort();
                    }
            
                    this.#isRunning = false;

                    if (e.message == "Complete") {

                        this.#completedSuccessfully = true;
                        this.#returnValue = e.cause;

                        this.#emit("complete", {
                            chain: this,
                            error: null,
                            lastTaskIndex: i,
                        });
                    }
                    else if (e.message == "Cancel") {

                        this.#completedSuccessfully = false;
                        this.#returnValue = null;

                        this.#emit("cancel", {
                            chain: this,
                            error: null,
                            lastTaskIndex: i,
                        });
                    }
                    else {

                        this.#completedSuccessfully = false;
                        this.#returnValue = null;

                        this.#emit("error", {
                            chain: this,
                            error: e,
                            lastTaskIndex: i,
                        });
                    }

                    return this.#returnValue;
                }

                if (i + 1 >= this.tasks.length) {
                    break;
                }

                i++;
            }
        }

        if (!this.#chainController.abortController.signal.aborted) {
            this.#chainController.abortController.abort();
        }

        this.#isRunning = false;
        this.#completedSuccessfully = true;
        this.#returnValue = previousResult;

        this.#emit("complete", {
            chain: this,
            error: null,
            lastTaskIndex: i,
        });

        return this.#returnValue;
    }

    /**
     * Waits until the chain is not running anymore. If the chain is not running, the function returns immediately.
     * @returns {Promise<void>}
     */
    async waitForChainToFinish() {
        while (this.#isRunning) {
            await sleep(100);
        }
    }

    /**
     * Cancels the running chain, if it is running
     * @returns {Promise<void>}
     * @throws {Error} with message "Cancel", if the chain is not running
     */
    async cancel() {
        if (this.#isRunning) {
            this.#chainController.abortController.abort("Cancel");
        }

        await this.waitForChainToFinish();
    }

    /**
     * Returns the context of the chain
     * @returns {T}
     */
    get ctx() {
        return this.#ctx;
    }

    /**
     * The return value of the last task in the chain, if the chain has completed successfully
     * @type {U|null}
     */
    get returnValue() {
        return this.#returnValue;
    }

    /**
     * Indicates whether the chain has completed successfully.
     */
    get completedSuccessfully() {
        return this.#completedSuccessfully;
    }

    /**
     * Whether the chain is currently running
     * @type {boolean}
     */
    get isRunning() {
        return this.#isRunning;
    }
}