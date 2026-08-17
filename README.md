# Chain.js

**Chain** is a lightweight, promise-based library for building and executing sequential tasks with built‑in cancellation, context propagation, and event emission.  
It is ideal for orchestrating asynchronous workflows, retry logic, or data pipelines.

---

## Features

- **Task chaining** – compose asynchronous tasks in a clear, linear sequence.
- **Cancellation** – cancel the entire chain at any point using `AbortController` or the provided `cancel()` method.
- **Context** – share state across tasks via a typed context object.
- **Events** – subscribe to `run`, `complete`, `cancel`, `error`, and `fail` events.
- **Abort‑aware utilities** – built‑in `sleep`, `fetch`, and `wrap` that respect cancellation signals.
- **Early completion** – finish the chain prematurely with a custom result.
- **TypeScript‑friendly** – fully typed with JSDoc; works seamlessly in JavaScript and TypeScript projects.

---

## Installation

```bash
npm install @supercat1337/chain
```

---

## Quick Start

```javascript
import { Chain } from '@supercat1337/chain';

const chain = new Chain(); // optional: pass a context object

chain
    .add(async prev => {
        console.log('Task 1');
        return 1;
    })
    .add(async prev => {
        console.log(`Task 2, previous = ${prev}`);
        return prev + 1;
    })
    .add(async prev => {
        console.log(`Task 3, result = ${prev + 1}`);
        return prev + 1;
    });

const result = await chain.run();
console.log('Final result:', result);
// Output: Task 1, Task 2, Task 3, Final result: 3
```

---

## API Reference

### `Chain` class

#### Constructor

```typescript
new Chain<T>(ctx?: T, options?: { signal?: AbortSignal })
```

- **`ctx`** – shared context object (any `Record<string, any>`). Defaults to `{}`.
- **`options.signal`** – an external `AbortSignal` that can cancel the chain from outside.

#### Properties

| Property                | Type        | Description                                                 |
| ----------------------- | ----------- | ----------------------------------------------------------- |
| `ctx`                   | `T`         | The context object shared among tasks.                      |
| `returnValue`           | `U \| null` | The final result if the chain completed successfully.       |
| `completedSuccessfully` | `boolean`   | `true` if the chain finished without cancellation or error. |
| `isRunning`             | `boolean`   | `true` while the chain is executing.                        |

#### Methods

##### `on(event, listener)`

Adds an event listener. Returns an **unsubscribe** function.

```typescript
chain.on('complete', details => console.log(details.chain.returnValue));
```

Events: `'run'`, `'complete'`, `'cancel'`, `'error'`, `'fail'`.

##### `add(task)`

Appends a task to the chain.

```typescript
chain.add((previousResult, controller) => {
    // previousResult – value returned by the previous task (or initValue)
    // controller – ChainController instance (see below)
    return newValue; // or Promise
});
```

##### `run(initValue?)`

Executes the chain. Returns a promise that resolves with the final result (or `null` if cancelled/failed).

- **Throws** `AlreadyRunningError` if the chain is already running.

##### `cancel()`

Cancels the running chain. Returns a promise that resolves when the chain has fully stopped.

##### `waitForChainToFinish()`

Waits for the chain to finish (whether by completion, cancellation, or error). Resolves immediately if not running.

---

### `ChainController` object

The second argument passed to every task provides control over the chain.

#### Properties

- `chain` – reference to the parent `Chain` instance.
- `abortController` – the internal `AbortController`.
- `ctx` – shortcut to `chain.ctx`.

#### Methods

##### `cancel()`

Throws a `CancelError` to cancel the chain.

##### `complete(value)`

Throws a `CompleteError` with the given value to finish the chain early.

##### `sleep(ms)`

Sleeps for `ms` milliseconds. The promise rejects with `CancelError` if the chain is cancelled during sleep.

##### `fetch(url, options)`

Wraps `fetch()` with the internal abort signal. Automatically aborts the request on cancellation.

##### `wrap(fn)`

Wraps an async function so that it rejects with `CancelError` if the chain is cancelled during its execution. Useful for integrating third‑party callbacks that do not support `AbortSignal`.

##### `checkAbortSignal()`

Throws `CancelError` if the chain has been cancelled.

---

## Error Types

All errors thrown by the library are subclasses of `Error` and can be caught via `try/catch` or the `'error'` event.

- **`CancelError`** – thrown when the chain is cancelled (via `cancel()` or external signal).
- **`CompleteError`** – thrown when `complete()` is called (it carries the return value in `error.returnValue`).
- **`AlreadyRunningError`** – thrown when `run()` is called on a chain that is already running.

These errors are exported and can be imported:

```javascript
import { CancelError, CompleteError, AlreadyRunningError } from '@supercat1337/chain';
```

---

## Examples

### 1. Early completion with `complete()`

```javascript
import { Chain } from '@supercat1337/chain';

const chain = new Chain();

chain
    .add(async prev => {
        console.log('Task 1');
        return 10;
    })
    .add(async (prev, ctrl) => {
        console.log('Task 2 – completing early');
        ctrl.complete(42); // skip remaining tasks
    })
    .add(async () => {
        console.log('Task 3 – never executed');
    });

const result = await chain.run();
console.log('Result:', result); // 42
```

### 2. Cancellation

```javascript
import { Chain } from '@supercat1337/chain';

const chain = new Chain();

chain.on('cancel', () => console.log('Cancelled!'));

chain
    .add(async (prev, ctrl) => {
        console.log('Task 1');
        ctrl.cancel(); // cancels the whole chain
    })
    .add(async () => {
        console.log('Task 2 – never executed');
    });

const result = await chain.run();
console.log('Result:', result); // null
```

### 3. Using `sleep` and external cancellation

```javascript
import { Chain } from '@supercat1337/chain';

const chain = new Chain();

chain.add(async (prev, ctrl) => {
    console.log('Waiting 5s...');
    await ctrl.sleep(5000);
    return 'done';
});

const promise = chain.run();
setTimeout(() => chain.cancel(), 1000); // cancel after 1s
await promise; // throws or resolves with null
```

### 4. Abort‑aware `fetch`

```javascript
chain.add(async (prev, ctrl) => {
    const response = await ctrl.fetch('https://api.example.com/data');
    return response.json();
});
// The fetch will abort automatically if the chain is cancelled.
```

### 5. Wrapping an uncancellable function

```javascript
import { Chain } from '@supercat1337/chain';

async function longRunningTask() {
    // This function does not support AbortSignal
}

const chain = new Chain();
chain.add(async (prev, ctrl) => {
    const wrapped = ctrl.wrap(longRunningTask);
    await wrapped(); // rejects with CancelError if chain is cancelled
});
```

---

## Live Demos

Explore the interactive examples in the [demo](./demo) directory:

- [Basic](./demo/pages/basic/) – simple chain with events
- [Fetch + Cache](./demo/pages/fetch-cache/) – data fetching with caching and cancellation
- [Cancel](./demo/pages/cancel/) – cancel mid‑execution
- [Complete](./demo/pages/complete/) – early completion
- [Wrap](./demo/pages/wrap/) – wrapping async functions

---

## Running the Examples

Clone the repository and run any example:

```bash
node examples/basic.js
```

For the web demos, serve the `demo/` folder with any static server (e.g., `npx serve demo`).

---

## License

MIT © [Albert Bazaleev](https://github.com/supercat1337)
