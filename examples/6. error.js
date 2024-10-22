// @ts-check

import { Chain } from "../src/index.js";

const chain = new Chain();

chain.on("complete", () => {
    console.log("complete");
});

chain.on("cancel", () => {
    console.log("cancel");
});

chain.on("error", (details) => {
    console.log("error", details.error?.message);
});

chain.on("run", () => {
    console.log("run");
});

chain
    .add(async (previousResult, chainController) => {
        console.log("task 0");
        return 0;
    })
    .add(async (previousResult, chainController) => {
        console.log("task 1");
        console.log("previousResult = ", previousResult);
        throw new Error("custom error");
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
run
task 0
task 1
previousResult =  0
error custom error
result =  null
*/