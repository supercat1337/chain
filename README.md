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

/** @type {Chain<number>} */
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
    .add((previousResult, chainController) => {
        console.log("task 0");
        return 0;
    })
    .add((previousResult, chainController) => {
        console.log("task 1");
        console.log("previousResult = ", previousResult);
        return 1;
    })
    .add((previousResult, chainController) => {
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
* **`ctx`**: The context object associated with the chain. This can be used to pass data between tasks. By default, the context object is an empty object. 

### Methods

* **`on(event, listener)`**: Adds an event listener to the chain for a specific event. Returns a function that can be used to unsubscribe from the event.
* **`add(task)`**: Adds a task to the end of the chain.
* **`run(initValue?, ctx?)`**: Runs the chain, executing each task in sequence, and returns a promise that resolves with the result of the last task if the chain completes successfully. Ctx is the context object associated with the chain.
* **`waitForChainToFinish()`**: Waits until the chain is no longer running and returns a promise that resolves immediately if the chain is not running.
* **`cancel()`**: Cancels the running chain, if it is currently running.

### Events

* **`complete`**: Fired when the chain completes successfully.
* **`cancel`**: Fired when the chain is cancelled.
* **`error`**: Fired when an error occurs during execution.
* **`run`**: Fired when the chain is started running.

Details are provided in listener functions. The `details` object has the following properties:

* **`chain`**: The task chain being managed by the chainController.
* **`lastTaskIndex`**: The index of the last task in the chain that was executed.
* **`error`**: The error raised by the task, if any.

## Chain management by using the `ChainController` object.

The second parameter of the task function in the `Chain` class is `chainController` object.

`chainController` object provides methods for managing the chain's state and executing tasks. 

### Properties

* **`chain`**: The task chain being managed by the chainController.
* **`abortController`**: The `AbortController` associated with the chainController.
* **`ctx`**: The context object associated with the chain.

### Methods

* **`cancel()`**: Cancels the running chain, if it is currently running.
* **`complete(value)`**: Completes the running chain with the given value, if it is currently running.
* **`sleep(ms)`**: Sleeps for the given amount of milliseconds. If the chainController is cancelled during the sleep, the promise is resolved immediately.
* **`fetch(url, options)`**: Wraps the global `fetch` function and adds the abort signal to the given options. If the chainController is cancelled during the fetch, the promise is resolved immediately.
* **`wrap(fn)`**: Wraps a function to ensure it respects the ChainController's abort signal. If the chainController is cancelled during the execution of the function, the promise is rejected with an "Cancel" error.
* **`checkAbortSignal()`**: Checks if the abort signal is aborted and cancels the running chain if needed.

### Usage

Here is an example of using the `chainController` object. Chain is completed with value 100:
```javascript
import { Chain } from "@supercat1337/chain";

/** @type {Chain<number>} */
const chain = new Chain();

chain
    .add(async (previousResult, chainController) => {
        console.log("task 0");
        return 0;
    })
    .add(async (previousResult, chainController) => {
        console.log("task 1");
        chainController.complete(100);
        return 1;
    })
    .add(async (previousResult, chainController) => {
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

/** @type {Chain<number>} */
const chain = new Chain();

chain.on("cancel", (details) => {
    console.log("cancel");
});

chain
    .add((previousResult, chainController) => {
        console.log("task 0");
        return 0;
    })
    .add((previousResult, chainController) => {
        console.log("task 1");
        chainController.cancel();
        return 1;
    })
    .add((previousResult, chainController) => {
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

### Example of using cancellable fetch 

Here is an example of fetching data with the `chainController` object and aborting the request:

```javascript
import { Chain } from "@supercat1337/chain";

    const chain = new Chain();

    chain
        .add((previousResult, chainController) => {
            return chainController.fetch("https://example.com");
        });

    chain.run();
    await chain.cancel();
```

### Example of wrapping an async function 

Here is an example of wrapping a function that can't be cancelled by the abort signal:

```javascript
import { Chain } from "@supercat1337/chain";

// async function that can't be cancelled by the abort signal.
// function will be executed after 5 seconds and will log "test"
async function test() {
    return new Promise(resolve => setTimeout(()=>{
        console.log("test");
        resolve();
    }, 5000));    

}

const chain = new Chain();

chain.add(async (v, chainController) => {
    let fn = chainController.wrap(test);
    await fn();
});

chain.add(async () => {
    console.log("Never executed");
});

console.log("Start");
chain.run();
await sleep(1000);
await chain.cancel();
console.log("End");

/* Output:
Start
End
test
*/

Also see the [examples](./examples) directory for more examples.

## License

The `Chain` class is licensed under the [MIT License](https://opensource.org/licenses/MIT).