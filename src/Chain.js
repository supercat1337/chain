// @ts-check

import { EventEmitter } from '@supercat1337/event-emitter';
import { ChainController } from './ChainController.js';
import { CancelError, CompleteError, AlreadyRunningError } from './errors.js';

/**
 * @template {any} U
 * @template {{[key: string]: any}} [T={}]
 */
export class Chain {
    /** @type {EventEmitter<"complete"|"cancel"|"error"|"run"|"fail">} */
    #eventEmitter = new EventEmitter();

    /** @type {import('./types.d.ts').Task<U,T>[]} */
    #tasks = /** @type {import('./types.d.ts').Task<U,T>[]} */ ([]);

    /** @type {U|null} */
    #returnValue = null;

    /** @type {boolean} */
    #completedSuccessfully = false;

    /** @type {boolean} */
    #isRunning = false;

    /** @type {T} */
    #ctx = /** @type {T} */ ({});

    /** @type {ChainController<U,T>} */
    #chainController;

    /** @type {AbortSignal | undefined} */
    #externalSignal;

    /**
     * @param {T} [ctx] - initial context
     * @param {{ signal?: AbortSignal }} [options]
     */
    constructor(ctx, options = {}) {
        if (ctx) {
            this.#ctx = ctx;
        }
        this.#externalSignal = options.signal;
        this.#chainController = new ChainController(this, this.#externalSignal);
    }

    /**
     * Adds an event listener.
     * @param {'complete'|'cancel'|'error'|'run'|'fail'} event
     * @param {(details: { chain: Chain<U,T>, lastTaskIndex: number, error: Error | null }) => void} listener
     * @returns {() => void} unsubscribe function
     */
    on(event, listener) {
        return this.#eventEmitter.on(event, listener);
    }

    /**
     * Adds a task to the chain.
     * @param {(previousResult: any, chainController: ChainController<U,T>) => any} task
     * @returns {this}
     */
    add(task) {
        this.#tasks.push(task);
        return this;
    }

    /**
     * Internal emit helper.
     * @param {'complete'|'cancel'|'error'|'run'|'fail'} event
     * @param {{ chain: Chain<U,T>, lastTaskIndex: number, error: Error | null }} details
     */
    #emit(event, details) {
        this.#eventEmitter.emit(event, details);
    }

    /**
     * Runs the chain.
     * @param {*} [initValue]
     * @returns {Promise<U|null>}
     * @throws {AlreadyRunningError} if the chain is already running
     */
    async run(initValue) {
        if (this.#isRunning) {
            const err = new AlreadyRunningError();
            this.#emit('error', { chain: this, error: err, lastTaskIndex: -1 });
            throw err;
        }

        // Re‑create the controller with the same external signal
        this.#chainController = new ChainController(this, this.#externalSignal);
        this.#isRunning = true;
        this.#completedSuccessfully = false;
        this.#returnValue = null;
        let previousResult = initValue;

        this.#emit('run', { chain: this, lastTaskIndex: -1, error: null });

        try {
            for (let i = 0; i < this.#tasks.length; i++) {
                // Yield to the event loop between tasks
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }

                this.#chainController.checkAbortSignal();
                previousResult = await this.#tasks[i](previousResult, this.#chainController);
            }

            // Successful completion (all tasks finished)
            this.#isRunning = false;
            this.#completedSuccessfully = true;
            this.#returnValue = previousResult;
            this.#emit('complete', {
                chain: this,
                lastTaskIndex: this.#tasks.length - 1,
                error: null,
            });
            return this.#returnValue;
        } catch (e) {
            // Ensure the internal signal is aborted (if not already)
            if (!this.#chainController.abortController.signal.aborted) {
                this.#chainController.abortController.abort();
            }
            this.#isRunning = false;

            if (e instanceof CompleteError) {
                this.#completedSuccessfully = true;
                this.#returnValue = e.returnValue;
                this.#emit('complete', {
                    chain: this,
                    lastTaskIndex: this.#tasks.length - 1,
                    error: null,
                });
                return this.#returnValue;
            }

            if (e instanceof CancelError) {
                this.#completedSuccessfully = false;
                this.#returnValue = null;
                this.#emit('cancel', {
                    chain: this,
                    lastTaskIndex: this.#tasks.length - 1,
                    error: null,
                });
                this.#emit('fail', {
                    chain: this,
                    lastTaskIndex: this.#tasks.length - 1,
                    error: null,
                });
                return null;
            }

            // Any other error – ensure it's an Error instance
            const errorObj = e instanceof Error ? e : new Error(String(e));

            this.#completedSuccessfully = false;
            this.#returnValue = null;
            this.#emit('error', {
                chain: this,
                error: errorObj,
                lastTaskIndex: this.#tasks.length - 1,
            });
            this.#emit('fail', {
                chain: this,
                error: errorObj,
                lastTaskIndex: this.#tasks.length - 1,
            });
            return null;
        }
    }

    /**
     * Waits for the chain to finish.
     * @returns {Promise<void>}
     */
    waitForChainToFinish() {
        if (!this.#isRunning) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const unsubscribe = () => {
                if (!this.#isRunning) {
                    completeUnsubscribe();
                    cancelUnsubscribe();
                    errorUnsubscribe();
                    resolve();
                }
            };
            const completeUnsubscribe = this.#eventEmitter.on('complete', unsubscribe);
            const cancelUnsubscribe = this.#eventEmitter.on('cancel', unsubscribe);
            const errorUnsubscribe = this.#eventEmitter.on('error', unsubscribe);
        });
    }

    /**
     * Cancels the running chain.
     * @returns {Promise<void>}
     */
    async cancel() {
        if (this.#isRunning) {
            this.#chainController.abortController.abort();
        }
        await this.waitForChainToFinish();
    }

    /** Returns the chain's context. */
    get ctx() {
        return this.#ctx;
    }

    /** Returns the final result if completed successfully, else null. */
    get returnValue() {
        return this.#returnValue;
    }

    /** Whether the chain completed successfully. */
    get completedSuccessfully() {
        return this.#completedSuccessfully;
    }

    /** Whether the chain is currently running. */
    get isRunning() {
        return this.#isRunning;
    }
}
