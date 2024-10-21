// @ts-check

import { EventEmitter } from "@supercat1337/event-emitter";

/** @typedef {(previousResult:any, chain:Engine)=>any} Task */

/**
 * Sleeps for the given amount of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** @typedef {{taskIndex: number, error: Error|null, chain: Chain}} Details */

class Engine {

    abortController = new AbortController;

    /**
     * Creates an engine instance
     * @param {Chain} chain
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
        this.chain.returnValue = null;
        this.abortController.abort();

        let error = new Error("Cancel");
        throw error;
    }

    /**
     * Completes the running chain, if it is running
     * @param {*} [return_value] value to return as result of the chain
     * @throws {Error} with message "Complete", if the chain is not running
     */
    complete(return_value) {
        this.checkAbortSignal();

        this.chain.returnValue = return_value;
        this.abortController.abort();

        let error = new Error("Complete");
        throw error;
    }

    /**
     * Raises an error for the running chain, if it is running
     * @param {Error} error
     * @throws {Error} the given error
     */
    raiseError(error) {
        this.checkAbortSignal();

        this.chain.returnValue = null;
        this.abortController.abort();
        throw error;
    }

    /**
     * Sleeps for the given amount of milliseconds. If the engine is cancelled during the sleep, the promise is resolved immediately.
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
     * If the engine is cancelled during the fetch, the promise is resolved immediately.
     * @param {string} url
     * @param {RequestInit} [options]
     * @returns {Promise<Response>}
     */
    fetch(url, options) {
        this.checkAbortSignal();

        return fetch(url, Object.assign({}, options, { signal: this.abortController.signal }));
    }

/**
 * Wraps a function to ensure it respects the Engine's abort signal.
 * If the engine is cancelled during the execution of the function, the promise is rejected with an "Cancel" error.
 * @template {(...params:any[]) => Promise<any>} T
 * @param {T} fn - The function to wrap.
 * @returns {T} A new function that returns a promise, which resolves or rejects based on the original function's outcome or the abort signal.
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

                fn(...params).then((res)=>{
                    that.abortController.signal.removeEventListener("abort", callback);
                    resolve(res);
                }).catch(reject);

            });
        };

        return /** @type {T} */ (func);
    }

    /**
     * Returns the context of the chain
     * @returns {{[key:string]:any}}
     */
    get ctx() {
        return this.chain.getCtx();
    }
}

/*
Class Overview The Chain class represents a sequence of tasks that can be executed in a specific order. It provides methods for adding tasks, running the chain, and managing its state.

Methods

on(event, listener): Adds an event listener to the chain for a specific event (e.g. "complete", "cancel", "error", "run").
add(task): Adds a task to the end of the chain.
run(ctx): Runs the chain, executing each task in sequence, and returns a promise that resolves with the result of the last task if the chain completes successfully.
waitForChainToFinish(): Waits until the chain is no longer running and returns a promise that resolves immediately if the chain is not running.
cancel(): Cancels the running chain, if it is currently running.
getCtx(): Returns the context object associated with the chain.
Note that the Chain class uses an internal Engine instance to manage its state and execute tasks. The Engine instance is not exposed publicly.

The Engine instance is available as a parameter of the task functions. 
You can use this instance to cancel the chain, complete the chain, or raise an error for the chain.

Example #1
```js
const chain = new Chain();
chain
    .add((previousResult, engine) => {
        return 1;
    })
    .add((previousResult, engine) => {
        console.log(previousResult == 1); // Output: true
        return 2;
    });

await chain.run();
```

Example #2
```js
const chain = new Chain();
chain
    .add((previousResult, engine) => {
        return 1;
    })
    .add((previousResult, engine) => {
        console.log(previousResult == 1); // Output: true
        if (previousResult == 1) {
            engine.cancel();
        }
        return 2;
    });

await chain.run(); // Output: null
```
*/

export class Chain {

    /** @type {EventEmitter<"complete"|"cancel"|"error"|"run">} */
    #eventEmitter = new EventEmitter();

    /** @type {Task[]} */
    tasks = [];

    /** @type {any}  */
    returnValue;

    /** @type {boolean} */
    completedSuccessfully = false;

    /** @type {boolean} */
    isRunning = false;

    #ctx = {}

    /** @type {Engine} */
    #engine = new Engine(this);

    /**
     * Adds an event listener to the chain
     * @param {"complete"|"cancel"|"error"|"run"} event
     * @param {(details:Details)=>void} listener
     * @returns {()=>void} unsubscribe function
     */
    on(event, listener) {
        return this.#eventEmitter.on(event, listener);
    }

    /**
     * Adds a task to the chain
     * @param {Task} task
     * @returns {Chain} this
     */
    add(task) {
        this.tasks.push(task);
        return this;
    }

    /**
     * 
     * @param {"complete"|"cancel"|"error"|"run"} event
     * @param {Details} details
     * 
     */
    #emit(event, details) {
        this.#eventEmitter.emit(event, details);
    }

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
    async run(ctx) {
        ctx = ctx || {};

        if (this.isRunning) {
            
            this.#emit("error", {
                chain: this,
                error: new Error("Already running"),
                taskIndex: -1,
            });

            return null;
        }

        this.#engine = new Engine(this);

        this.isRunning = true;
        var previousResult = undefined;

        this.completedSuccessfully = false;
        this.returnValue = null;
        this.#ctx = ctx;

        this.#emit("run", {
            chain: this,
            taskIndex: -1,
            error: null,
        });

        var i = 0;
        while (this.tasks[i]) {

            try {
                this.#engine.checkAbortSignal();

                previousResult = await this.tasks[i](previousResult, this.#engine);
            }
            catch (e) {
                this.isRunning = false;

                if (e.message == "Complete") {

                    this.isRunning = false;
                    this.completedSuccessfully = true;

                    this.#emit("complete", {
                        chain: this,
                        error: null,
                        taskIndex: i,
                    });

                    return this.returnValue;
                }
                else if (e.message == "Cancel") {

                    this.isRunning = false;
                    this.completedSuccessfully = false;

                    this.#emit("cancel", {
                        chain: this,
                        error: null,
                        taskIndex: i,
                    });

                    return null;
                }
                else {

                    this.isRunning = false;
                    this.completedSuccessfully = false;
                    this.returnValue = null;

                    this.#emit("error", {
                        chain: this,
                        error: e,
                        taskIndex: i,
                    });

                    return null;

                }

            }

            i++;
        }

        this.isRunning = false;
        this.completedSuccessfully = true;
        this.returnValue = previousResult;

        this.#emit("complete", {
            chain: this,
            error: null,
            taskIndex: i - 1,
        });

        return previousResult;
    }

    /**
     * Waits until the chain is not running anymore. If the chain is not running, the function returns immediately.
     * @returns {Promise<void>}
     */
    async waitForChainToFinish() {
        while (this.isRunning) {
            await sleep(100);
        }
    }

    /**
     * Cancels the running chain, if it is running
     * @returns {Promise<void>}
     * @throws {Error} with message "Cancel", if the chain is not running
     */
    async cancel() {
        if (this.isRunning) {
            this.#engine.abortController.abort("Cancel");
        }

        await this.waitForChainToFinish();
    }

    /**
     * Returns the context of the chain
     * @returns {{[key:string]:any}}
     */
    getCtx() {
        return this.#ctx;
    }
}