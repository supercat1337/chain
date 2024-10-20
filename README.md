# Chain.js 

The `Chain` is a library for creating and executing tasks in a specific order. It provides methods for adding tasks, running the chain, and managing its state.

## Features

* **Task chaining**: Create a sequence of tasks that can be executed in a specific order.
* **Event listeners**: Add event listeners to the chain for specific events (e.g. "complete", "cancel", "error", "run").
* **Context management**: Associate a context object with the chain, which can be accessed by tasks during execution.
* **State management**: Manage the state of the chain, including whether it is currently running or not.
* **Cancellation**: Cancel the running chain, if it is currently running.

## Installation

To install the `Chain` library, run the following command in your terminal:
`npm install @supercat1337/chain`

## Usage

Here is an example of how to use the `Chain` class:
```javascript
import { Chain } from "@supercat1337/chain";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const chain = new Chain();

// Add an event listener for the "complete" event
chain.on("complete", details => {
  console.log(`Chain completed with result: ${details.chain.returnValue}`);
});

chain.on("cancel", () => {
    console.log("cancel");
});

chain.on("error", (details) => {
    console.log("error", details.error);
});

chain.on("run", () => {
    console.log("run");
});

chain
    .add(async (previousResult, engine) => {
        console.log("task 0");
        return 0;
    })
    .add(async (previousResult, engine) => {
        console.log("task 1");
        console.log("previousResult = ", previousResult);
        return 1;
    })
    .add(async (previousResult, engine) => {
        console.log("task 2");
        return 2;
    });

chain.run().then(result => {
    console.log("result = ", result);
});

/* Output:
run
task 0
task 1
previousResult =  0
task 2
Chain completed with result: 2
result =  2
*/

```
## Chain class

The `Chain` class provides methods for adding tasks, running the chain, and managing its state.

### Properties

* **`tasks`**: The array of tasks being managed by the chain.
* **`isRunning`**: Whether the chain is currently running.
* **`completedSuccessfully`**: Whether the chain completed successfully.
* **`returnValue`**: The return value of the last task in the chain.

### Methods

* **`on(event, listener)`**: Adds an event listener to the chain for a specific event.
* **`add(task)`**: Adds a task to the end of the chain.
* **`run(ctx)`**: Runs the chain, executing each task in sequence, and returns a promise that resolves with the result of the last task if the chain completes successfully.
* **`waitForChainToFinish()`**: Waits until the chain is no longer running and returns a promise that resolves immediately if the chain is not running.
* **`cancel()`**: Cancels the running chain, if it is currently running.
* **`getCtx()`**: Returns the context object associated with the chain.

### Events

* **`complete(details)`**: Fired when the chain completes successfully.
* **`cancel(details)`**: Fired when the chain is cancelled.
* **`error(details)`**: Fired when an error occurs during execution.
* **`run(details)`**: Fired when the chain is started running.

Details are provided in listener functions. The `details` object has the following properties:

* **`chain`**: The task chain being managed by the engine.
* **`taskIndex`**: The index of the task in the chain.
* **`error`**: The error raised by the task, if any.

## Chain management by using the `Engine` class

The second parameter of the task function in the `Chain` class is an instance of the `Engine` class.

The `Engine` class is a utility class that manages the state and execution of tasks in a task chain. It provides methods for cancelling, completing, and raising errors for the chain.

### Properties

* **`chain`**: The task chain being managed by the engine.
* **`abortController`**: The `AbortController` associated with the engine.

### Methods

* **`cancel()`**: Cancels the running chain, if it is currently running.
* **`complete(value)`**: Completes the running chain with the given value, if it is currently running.
* **`raiseError(error)`**: Raises an error for the running chain, if it is currently running.
* **`sleep(ms)`**: Sleeps for the given amount of milliseconds. If the engine is cancelled during the sleep, the promise is resolved immediately.
* **`fetch(url, options)`**: Wraps the global `fetch` function and adds the abort signal to the given options. If the engine is cancelled during the fetch, the promise is resolved immediately.

### Usage

Here is an example of how to use the `Engine` class:
```javascript
import { Chain } from "@supercat1337/chain";

const chain = new Chain();

chain
    .add(async (previousResult, engine) => {
        console.log("task 0");
        return 0;
    })
    .add(async (previousResult, engine) => {
        console.log("task 1");
        engine.complete(100);
        return 1;
    })
    .add(async (previousResult, engine) => {
        console.log("task 2");
        return 2;
    });

chain.run().then(result => {
    console.log("result = ", result);
});

/* Output:
task 0
task 1
result =  100
*/
```

### Example of cancelling the chain

Here is an example of cancelling the chain:

```javascript
import { Chain } from "@supercat1337/chain";

const chain = new Chain();

chain.on("cancel", (details) => {
    console.log("cancel");
});

chain
    .add((previousResult, engine) => {
        console.log("task 0");
        return 0;
    })
    .add((previousResult, engine) => {
        console.log("task 1");
        engine.cancel();
        return 1;
    })
    .add((previousResult, engine) => {
        console.log("task 2");
        return 2;
    });

chain.run().then(result => {
    console.log("result = ", result);
});

/* Output:
task 0
task 1
cancel
result =  null
*/
```

### Example of fetching data with the `Engine` class

Here is an example of fetching data with the `Engine` class and aborting the request:

```javascript
import { Chain } from "@supercat1337/chain";

    const chain = new Chain();
    let foo = 0;

    chain.on("cancel", () => {
        t.log("cancel");
    });

    chain
        .add(async (previousResult, engine) => {
            let res = engine.fetch("https://example.com");

            res.catch(e => {
                foo++;
            });

            engine.abortController.abort();
            return await res;
        });

    await chain.run();
    console.log("foo = ", foo);

/* Output:
foo =  1
*/
```

Also see the [examples](./examples) directory for more examples.

## License

The `Chain` class is licensed under the [MIT License](https://opensource.org/licenses/MIT).