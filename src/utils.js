import { CancelError } from './errors.js';

/**
 * Sleeps for the given milliseconds. If a signal is provided, aborts on signal.
 * @param {number} ms
 * @param {AbortSignal} [signal] - optional abort signal
 * @returns {Promise<void>}
 */
export function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal && signal.aborted) {
            reject(new CancelError());
            return;
        }

        const timeout = setTimeout(() => {
            if (signal && onAbort) {
                signal.removeEventListener('abort', onAbort);
            }
            resolve();
        }, ms);

        /** @type {undefined|(()=>void)} */
        let onAbort;
        if (signal) {
            onAbort = () => {
                clearTimeout(timeout);
                reject(new CancelError());
            };
            signal.addEventListener('abort', onAbort);
        }
    });
}

/**
 * Wraps an async function to respect the abort signal.
 * @template {(...args: any[]) => Promise<any>} Fn
 * @param {Fn} fn
 * @param {AbortSignal} signal
 * @returns {Fn}
 */
export function wrap(fn, signal) {
    return /** @type {Fn} */ (
        (...args) => {
            if (signal.aborted) {
                return Promise.reject(new CancelError());
            }

            return new Promise((resolve, reject) => {
                let finished = false;

                const onAbort = () => {
                    if (!finished) {
                        finished = true;
                        reject(new CancelError());
                    }
                };
                signal.addEventListener('abort', onAbort);

                Promise.resolve(fn(...args))
                    .then(result => {
                        if (!finished) {
                            finished = true;
                            signal.removeEventListener('abort', onAbort);
                            resolve(result);
                        }
                    })
                    .catch(err => {
                        if (!finished) {
                            finished = true;
                            signal.removeEventListener('abort', onAbort);
                            reject(err);
                        }
                    });
            });
        }
    );
}
