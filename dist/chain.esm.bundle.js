// node_modules/@supercat1337/event-emitter/src/event-emitter-lite.js
var ORIGINAL = /* @__PURE__ */ Symbol("original");
var EventEmitterLite = class {
  /**
   * @type {Object.<Events extends string | symbol ? Events : keyof Events, Function[]>}
   */
  events = /* @__PURE__ */ Object.create(null);
  /**
   * @type {Function[]}
   * List of listeners that will be invoked for every emitted event.
   * Each listener receives (eventName, ...args).
   */
  anyListeners = [];
  /**
   * logErrors indicates whether errors thrown by listeners should be logged to the console.
   * @type {boolean}
   */
  logErrors = true;
  /**
   * on is used to add a callback function that's going to be executed when the event is triggered
   * @template {Events extends string | symbol ? Events : keyof Events} K
   * @param {K} event
   * @param {Function} listener
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {() => void}
   */
  on(event, listener, options = {}) {
    if (typeof listener !== "function") {
      throw new TypeError("listener must be a function");
    }
    const { signal } = options;
    if (signal?.aborted) {
      return () => {
      };
    }
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    const cleanup = () => {
      this.removeListener(event, listener);
      signal?.removeEventListener("abort", cleanup);
    };
    if (signal) {
      signal.addEventListener("abort", cleanup, { once: true });
    }
    return cleanup;
  }
  /**
   * Add a one-time listener
   * @template {Events extends string | symbol ? Events : keyof Events} K
   * @param {K} event
   * @param {Function} listener
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {()=>void}
   */
  once(event, listener, options = {}) {
    if (typeof listener !== "function") {
      throw new TypeError("listener must be a function");
    }
    const { signal } = options;
    if (signal?.aborted) {
      return () => {
      };
    }
    let cleanup;
    const wrapper = (...args) => {
      if (cleanup) {
        cleanup();
      }
      listener.apply(this, args);
    };
    wrapper[ORIGINAL] = listener;
    cleanup = this.on(event, wrapper, options);
    return cleanup;
  }
  /**
   * off is an alias for removeListener
   * @template {Events extends string | symbol ? Events : keyof Events} K
   * @param {K} event
   * @param {Function} listener
   */
  off(event, listener) {
    return this.removeListener(event, listener);
  }
  /**
   * Remove an event listener from an event
   * @template {Events extends string | symbol ? Events : keyof Events} K
   * @param {K} event
   * @param {Function} listener
   */
  removeListener(event, listener) {
    if (typeof listener !== "function") return;
    const listeners = this.events[event];
    if (!listeners) return;
    const idx = listeners.findIndex((l) => l === listener || l[ORIGINAL] === listener);
    if (idx > -1) {
      listeners.splice(idx, 1);
      if (listeners.length === 0) delete this.events[event];
    }
  }
  /**
   * Adds a listener that will be invoked for every emitted event.
   * @param {Function} listener - The callback (eventName, ...args) => void.
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {() => void}
   */
  onAny(listener, options = {}) {
    if (typeof listener !== "function") {
      throw new TypeError("listener must be a function");
    }
    const { signal } = options;
    if (signal?.aborted) {
      return () => {
      };
    }
    this.anyListeners.push(listener);
    const cleanup = () => {
      this.offAny(listener);
      signal?.removeEventListener("abort", cleanup);
    };
    if (signal) {
      signal.addEventListener("abort", cleanup, { once: true });
    }
    return cleanup;
  }
  /**
   * Removes a listener added via onAny.
   * @param {Function} listener - The listener function to remove.
   */
  offAny(listener) {
    const idx = this.anyListeners.indexOf(listener);
    if (idx > -1) {
      this.anyListeners.splice(idx, 1);
    }
  }
  /**
   * emit is used to trigger an event
   * @template {Events extends string | symbol ? Events : keyof Events} K
   * @param {K} event
   * @param {...any} args
   */
  emit(event, ...args) {
    const listeners = this.events[event];
    if (listeners) {
      const queue = listeners.slice();
      const length = queue.length;
      for (let i = 0; i < length; i++) {
        try {
          queue[i].apply(this, args);
        } catch (e) {
          if (this.logErrors) {
            console.error(`Error in listener for event "${String(event)}":`, e);
          }
        }
      }
    }
    this._emitAny(event, args);
  }
  /**
   * Protected method to invoke any-listeners.
   * @param {string | symbol} event
   * @param {any[]} args
   * @protected
   */
  _emitAny(event, args) {
    const anyListeners = this.anyListeners;
    if (anyListeners.length > 0) {
      const anyQueue = anyListeners.slice();
      const eventName = String(event);
      for (let i = 0; i < anyQueue.length; i++) {
        try {
          anyQueue[i].apply(this, [eventName, ...args]);
        } catch (e) {
          if (this.logErrors) {
            console.error(`Error in any-listener for event "${eventName}":`, e);
          }
        }
      }
    }
  }
  /**
   * Checks if an event has any listeners.
   * @param {Events extends string | symbol ? Events : keyof Events} event
   * @returns {boolean}
   */
  hasListeners(event) {
    const listeners = this.events[event];
    return !!(listeners && listeners.length > 0);
  }
  /**
   * Returns the number of listeners for a specific event.
   * @param {Events extends string | symbol ? Events : keyof Events} event
   * @returns {number}
   */
  listenerCount(event) {
    const listeners = this.events[event];
    return listeners ? listeners.length : 0;
  }
  /**
   * Returns an array of event names that have at least one listener (including Symbols).
   * @returns {(Events extends string | symbol ? Events : keyof Events)[]}
   */
  eventNames() {
    return Reflect.ownKeys(this.events);
  }
  /**
   * Returns a copy of the listeners array for the specified event.
   * @param {Events extends string | symbol ? Events : keyof Events} event
   * @returns {Function[]}
   */
  getListeners(event) {
    const listeners = this.events[event];
    return listeners ? listeners.slice() : [];
  }
  /**
   * Removes all listeners from all events.
   * @returns {void}
   */
  removeAllListeners() {
    this.events = /* @__PURE__ */ Object.create(null);
  }
  /**
   * Alias for removeAllListeners().
   * @deprecated Use removeAllListeners() instead.
   * @returns {void}
   */
  clear() {
    return this.removeAllListeners();
  }
  /**
   * Removes all listeners for a specific event.
   * Does not affect any-listeners.
   * @param {Events extends string | symbol ? Events : keyof Events} event
   * @returns {void}
   */
  removeAllListenersOf(event) {
    if (this.events[event]) {
      delete this.events[event];
    }
  }
};

// node_modules/@supercat1337/event-emitter/src/event-emitter.js
var HAS_LISTENERS = /* @__PURE__ */ Symbol("has-listeners");
var NO_LISTENERS = /* @__PURE__ */ Symbol("no-listeners");
var LISTENER_ERROR = /* @__PURE__ */ Symbol("listener-error");
var EventEmitter = class extends EventEmitterLite {
  /**
   * @type {EventEmitterLite<typeof HAS_LISTENERS | typeof NO_LISTENERS | typeof LISTENER_ERROR>}
   */
  #internalEvents = new EventEmitterLite();
  /**
   * @type {Map<string|symbol, Array<{ internalEvent: typeof HAS_LISTENERS | typeof NO_LISTENERS | typeof LISTENER_ERROR, handler: Function }>>}
   */
  #internalListenersMap = /* @__PURE__ */ new Map();
  #isDestroyed = false;
  #isReportingError = false;
  constructor() {
    super();
    this.#internalEvents.logErrors = false;
  }
  /**
   * @type {boolean}
   */
  get isDestroyed() {
    return this.#isDestroyed;
  }
  /**
   * @template {Events extends string | symbol ? Events : keyof Events} K
   * @param {K} event
   * @param {Function} listener
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {() => void}
   */
  on(event, listener, options = {}) {
    if (this.#isDestroyed) throw new Error("EventEmitter is destroyed");
    const hadListeners = this.hasListeners(event);
    const unsubscriber = super.on(event, listener, options);
    if (!hadListeners && this.hasListeners(event)) {
      this.#emitInternal(HAS_LISTENERS, event);
    }
    return unsubscriber;
  }
  /**
   * @template {Events extends string | symbol ? Events : keyof Events} K
   * @param {K} event
   * @param {Function} listener
   */
  removeListener(event, listener) {
    if (typeof listener !== "function") return;
    if (this.#isDestroyed || !this.events[event]) return;
    super.removeListener(event, listener);
    if (!this.events[event]) {
      this.#emitInternal(NO_LISTENERS, event);
    }
  }
  /**
   * @param {typeof HAS_LISTENERS | typeof NO_LISTENERS | typeof LISTENER_ERROR} internalEvent
   * @param {Function} listener
   * @param {string|symbol} [externalEvent]
   * @returns {()=>void}
   */
  #onInternalEvent(internalEvent, listener, externalEvent) {
    const unsub = this.#internalEvents.on(internalEvent, listener);
    if (externalEvent !== void 0) {
      if (!this.#internalListenersMap.has(externalEvent)) {
        this.#internalListenersMap.set(externalEvent, []);
      }
      const entries = this.#internalListenersMap.get(externalEvent);
      if (entries) {
        entries.push({ internalEvent, handler: listener });
      }
    }
    return () => {
      unsub();
      if (externalEvent !== void 0) {
        const entries = this.#internalListenersMap.get(externalEvent);
        if (entries) {
          const idx = entries.findIndex(
            (entry) => entry.handler === listener && entry.internalEvent === internalEvent
          );
          if (idx > -1) {
            entries.splice(idx, 1);
            if (entries.length === 0) {
              this.#internalListenersMap.delete(externalEvent);
            }
          }
        }
      }
    };
  }
  /**
   * @template {Events extends string | symbol ? Events : keyof Events} K
   * @param {K} event
   * @param {...any} args
   */
  emit(event, ...args) {
    if (this.#isDestroyed) return;
    const listeners = this.events[event];
    if (listeners) {
      const queue = listeners.slice();
      for (let i = 0; i < queue.length; i++) {
        try {
          queue[i].apply(this, args);
        } catch (e) {
          this.#emitInternal(LISTENER_ERROR, e, event, ...args);
          if (this.logErrors) {
            console.error(`Error in listener for event "${String(event)}":`, e);
          }
        }
      }
    }
    this._emitAny(event, args);
  }
  /**
   * Override to catch errors in any-listeners and emit LISTENER_ERROR.
   * @param {string | symbol} event
   * @param {any[]} args
   * @protected
   */
  _emitAny(event, args) {
    const anyListeners = this.anyListeners;
    if (anyListeners.length === 0) return;
    const anyQueue = anyListeners.slice();
    const eventName = String(event);
    for (let i = 0; i < anyQueue.length; i++) {
      try {
        anyQueue[i].apply(this, [eventName, ...args]);
      } catch (e) {
        this.#emitInternal(LISTENER_ERROR, e, event, ...args);
        if (this.logErrors) {
          console.error(`Error in any-listener for event "${eventName}":`, e);
        }
      }
    }
  }
  /**
   * @param {typeof HAS_LISTENERS | typeof NO_LISTENERS | typeof LISTENER_ERROR} event
   * @param {...any} args
   */
  #emitInternal(event, ...args) {
    const listeners = this.#internalEvents.events[event];
    if (!listeners || listeners.length === 0) return;
    const queue = listeners.slice();
    for (const fn of queue) {
      try {
        fn.apply(this, args);
      } catch (e) {
        if (event === LISTENER_ERROR || this.#isReportingError) {
          if (this.logErrors) {
            console.error("Critical error in internal listener:", e);
          }
          continue;
        }
        this.#isReportingError = true;
        try {
          this.#emitInternal(LISTENER_ERROR, e, event, ...args);
        } finally {
          this.#isReportingError = false;
        }
      }
    }
  }
  /**
   * @template {Events extends string | symbol? Events : keyof Events} K
   * @param {K} event
   * @param {number} [max_wait_ms=0]
   * @returns {Promise<boolean>}
   */
  waitForEvent(event, max_wait_ms = 0) {
    return this.waitForAnyEvent([event], max_wait_ms);
  }
  /**
   * @template {Events extends string | symbol? Events : keyof Events} K
   * @param {K[]} events
   * @param {number} [max_wait_ms=0]
   * @returns {Promise<boolean>}
   */
  waitForAnyEvent(events, max_wait_ms = 0) {
    if (this.#isDestroyed) throw new Error("EventEmitter is destroyed");
    if (!Array.isArray(events) || events.length === 0) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      let timeout;
      const unsubscribers = [];
      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        unsubscribers.forEach((u) => u());
      };
      const onEvent = () => {
        cleanup();
        resolve(true);
      };
      const uniqueEvents = [...new Set(events)];
      uniqueEvents.forEach((event) => {
        unsubscribers.push(this.on(event, onEvent));
      });
      if (max_wait_ms > 0) {
        timeout = setTimeout(() => {
          cleanup();
          resolve(false);
        }, max_wait_ms);
      }
    });
  }
  /**
   * @param {{ removeInternalListeners?: boolean }} [options]
   * @returns {void}
   */
  removeAllListeners(options = {}) {
    if (this.#isDestroyed) return;
    const { removeInternalListeners = false } = options;
    const eventNames = this.eventNames();
    super.removeAllListeners();
    for (const event of eventNames) {
      this.#emitInternal(NO_LISTENERS, event);
    }
    if (removeInternalListeners) {
      this.#clearAllInternalListeners();
    }
  }
  /**
   * @deprecated Use removeAllListeners() instead.
   * @returns {void}
   */
  clear() {
    return this.removeAllListeners();
  }
  /**
   * Destroys the event emitter.
   */
  destroy() {
    if (this.#isDestroyed) return;
    this.removeAllListeners({ removeInternalListeners: true });
    this.anyListeners = [];
    this.#internalEvents = new EventEmitterLite();
    this.#internalEvents.logErrors = false;
    this.#isDestroyed = true;
  }
  /**
   * @param {Events extends string | symbol ? Events : keyof Events} event
   * @returns {void}
   */
  removeAllListenersOf(event) {
    if (this.#isDestroyed) return;
    const hadListeners = this.hasListeners(event);
    super.removeAllListenersOf(event);
    if (hadListeners) {
      this.#emitInternal(NO_LISTENERS, event);
    }
  }
  /**
   * @deprecated Use removeAllListenersOf() instead.
   * @param {Events extends string | symbol ? Events : keyof Events} event
   * @returns {void}
   */
  clearEventListeners(event) {
    return this.removeAllListenersOf(event);
  }
  /**
   * @param {Events extends string | symbol ? Events : keyof Events} event
   * @returns {void}
   */
  removeAllInternalListenersOf(event) {
    if (this.#isDestroyed) return;
    const entries = this.#internalListenersMap.get(event);
    if (entries) {
      for (const { internalEvent, handler } of entries) {
        this.#internalEvents.removeListener(internalEvent, handler);
      }
      this.#internalListenersMap.delete(event);
    }
  }
  /**
   * @param {string|symbol} event
   * @param {Function} callback
   * @returns {()=>void}
   */
  onHasEventListeners(event, callback) {
    if (this.#isDestroyed) throw new Error("EventEmitter is destroyed");
    const handler = (emittedEvent, ...args) => {
      if (emittedEvent === event) {
        callback(emittedEvent, ...args);
      }
    };
    return this.#onInternalEvent(HAS_LISTENERS, handler, event);
  }
  /**
   * @param {string|symbol} event
   * @param {Function} callback
   * @returns {()=>void}
   */
  onNoEventListeners(event, callback) {
    if (this.#isDestroyed) throw new Error("EventEmitter is destroyed");
    const handler = (emittedEvent, ...args) => {
      if (emittedEvent === event) {
        callback(emittedEvent, ...args);
      }
    };
    return this.#onInternalEvent(NO_LISTENERS, handler, event);
  }
  /**
   * @param {Function} callback
   * @returns {()=>void}
   */
  onListenerError(callback) {
    if (this.#isDestroyed) throw new Error("EventEmitter is destroyed");
    return this.#onInternalEvent(LISTENER_ERROR, callback);
  }
  #clearAllInternalListeners() {
    for (const [key, entries] of this.#internalListenersMap) {
      for (const { internalEvent, handler } of entries) {
        this.#internalEvents.removeListener(internalEvent, handler);
      }
    }
    this.#internalListenersMap.clear();
  }
};

// src/errors.js
var CancelError = class extends Error {
  constructor() {
    super("Cancel");
    this.name = "CancelError";
  }
};
var CompleteError = class extends Error {
  /**
   * @param {any} returnValue - value to return as the chain result
   */
  constructor(returnValue) {
    super("Complete");
    this.name = "CompleteError";
    this.returnValue = returnValue;
  }
};
var AlreadyRunningError = class extends Error {
  constructor() {
    super("Already running");
    this.name = "AlreadyRunningError";
  }
};

// src/utils.js
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) {
      reject(new CancelError());
      return;
    }
    const timeout = setTimeout(() => {
      if (signal && onAbort) {
        signal.removeEventListener("abort", onAbort);
      }
      resolve();
    }, ms);
    let onAbort;
    if (signal) {
      onAbort = () => {
        clearTimeout(timeout);
        reject(new CancelError());
      };
      signal.addEventListener("abort", onAbort);
    }
  });
}
function wrap(fn, signal) {
  return (
    /** @type {Fn} */
    ((...args) => {
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
        signal.addEventListener("abort", onAbort);
        Promise.resolve(fn(...args)).then((result) => {
          if (!finished) {
            finished = true;
            signal.removeEventListener("abort", onAbort);
            resolve(result);
          }
        }).catch((err) => {
          if (!finished) {
            finished = true;
            signal.removeEventListener("abort", onAbort);
            reject(err);
          }
        });
      });
    })
  );
}

// src/ChainController.js
var ChainController = class {
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
        externalSignal.addEventListener("abort", () => {
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
};

// src/Chain.js
var Chain = class {
  /** @type {EventEmitter<"complete"|"cancel"|"error"|"run"|"fail">} */
  #eventEmitter = new EventEmitter();
  /** @type {import('./types.d.ts').Task<U,T>[]} */
  #tasks = (
    /** @type {import('./types.d.ts').Task<U,T>[]} */
    []
  );
  /** @type {U|null} */
  #returnValue = null;
  /** @type {boolean} */
  #completedSuccessfully = false;
  /** @type {boolean} */
  #isRunning = false;
  /** @type {T} */
  #ctx = (
    /** @type {T} */
    {}
  );
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
      this.#emit("error", { chain: this, error: err, lastTaskIndex: -1 });
      throw err;
    }
    this.#chainController = new ChainController(this, this.#externalSignal);
    this.#isRunning = true;
    this.#completedSuccessfully = false;
    this.#returnValue = null;
    let previousResult = initValue;
    this.#emit("run", { chain: this, lastTaskIndex: -1, error: null });
    try {
      for (let i = 0; i < this.#tasks.length; i++) {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        this.#chainController.checkAbortSignal();
        previousResult = await this.#tasks[i](previousResult, this.#chainController);
      }
      this.#isRunning = false;
      this.#completedSuccessfully = true;
      this.#returnValue = previousResult;
      this.#emit("complete", {
        chain: this,
        lastTaskIndex: this.#tasks.length - 1,
        error: null
      });
      return this.#returnValue;
    } catch (e) {
      if (!this.#chainController.abortController.signal.aborted) {
        this.#chainController.abortController.abort();
      }
      this.#isRunning = false;
      if (e instanceof CompleteError) {
        this.#completedSuccessfully = true;
        this.#returnValue = e.returnValue;
        this.#emit("complete", {
          chain: this,
          lastTaskIndex: this.#tasks.length - 1,
          error: null
        });
        return this.#returnValue;
      }
      if (e instanceof CancelError) {
        this.#completedSuccessfully = false;
        this.#returnValue = null;
        this.#emit("cancel", {
          chain: this,
          lastTaskIndex: this.#tasks.length - 1,
          error: null
        });
        this.#emit("fail", {
          chain: this,
          lastTaskIndex: this.#tasks.length - 1,
          error: null
        });
        return null;
      }
      const errorObj = e instanceof Error ? e : new Error(String(e));
      this.#completedSuccessfully = false;
      this.#returnValue = null;
      this.#emit("error", {
        chain: this,
        error: errorObj,
        lastTaskIndex: this.#tasks.length - 1
      });
      this.#emit("fail", {
        chain: this,
        error: errorObj,
        lastTaskIndex: this.#tasks.length - 1
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
    return new Promise((resolve) => {
      const unsubscribe = () => {
        if (!this.#isRunning) {
          completeUnsubscribe();
          cancelUnsubscribe();
          errorUnsubscribe();
          resolve();
        }
      };
      const completeUnsubscribe = this.#eventEmitter.on("complete", unsubscribe);
      const cancelUnsubscribe = this.#eventEmitter.on("cancel", unsubscribe);
      const errorUnsubscribe = this.#eventEmitter.on("error", unsubscribe);
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
};
export {
  AlreadyRunningError,
  CancelError,
  Chain,
  ChainController,
  CompleteError
};
