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
    console.log("error", details.error);
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
        await chainController.sleep(10000);
        return 1;
    })
    .add(async (previousResult, chainController) => {
        console.log("task 2");
        return 2;
    });

chain.run().then(result => {
    console.log("result = ", result);
});

chain.cancel();

/*
Output:

run
task 0
cancel
result =  null
*/