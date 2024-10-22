// @ts-check

import { Chain } from "../src/index.js";

const chain = new Chain();

chain.on("complete", () => {
    console.log("complete");
});

chain.on("cancel", () => {
    console.log("cancel");
});

chain.on("error", (e) => {
    console.log("error", e);
});

chain.on("run", (details) => {
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
