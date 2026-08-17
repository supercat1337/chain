// @ts-check

import { Chain } from './Chain.js';
import { CancelError, CompleteError } from './errors.js';
import { sleep, wrap } from './utils.js';

/**
 * @template {any} U
 * @template {{[key: string]: any}} T
 */
export class ChainController {
    /**
     * @param {Chain<U,T>} chain
     * @param {AbortSignal} [externalSignal]
     */
    constructor(chain, externalSignal) {
        this.chain = chain;
        this.abortController = new AbortController();

        if (externalSignal) {
            if (externalSignal.aborted) {
                this.abortController.abort();
            } else {
                externalSignal.addEventListener('abort', () => {
                    this.abortController.abort();
                });
            }
        }
    }

    /**
     * Throws a CancelError if the signal has been aborted.
     * @throws {CancelError}
     */
    checkAbortSignal() {
        if (this.abortController.signal.aborted) {
            throw new CancelError();
        }
    }

    /** Throws a CancelError to cancel the chain. */
    cancel() {
        throw new CancelError();
    }

    /**
     * Throws a CompleteError to finish the chain early.
     * @param {U} [returnValue]
     * @throws {CompleteError}
     */
    complete(returnValue) {
        throw new CompleteError(returnValue);
    }

    /**
     * Sleeps for the given milliseconds, abortable.
     * @param {number} ms
     * @returns {Promise<void>}
     */
    sleep(ms) {
        this.checkAbortSignal();
        return sleep(ms, this.abortController.signal);
    }

    /**
     * Wraps fetch with the abort signal.
     * @param {string} url
     * @param {RequestInit} [options]
     * @returns {Promise<Response>}
     */
    fetch(url, options) {
        this.checkAbortSignal();
        return fetch(url, { ...options, signal: this.abortController.signal });
    }

    /**
     * Wraps an async function to respect the abort signal.
     * @template {(...args: any[]) => Promise<any>} Fn
     * @param {Fn} fn
     * @returns {Fn}
     */
    wrap(fn) {
        return wrap(fn, this.abortController.signal);
    }

    /** Returns the chain's context. */
    get ctx() {
        return this.chain.ctx;
    }
}
