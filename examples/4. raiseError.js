// @ts-check

import { Chain } from "../src/index.js";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
    .add(async (previousResult, engine) => {
        console.log("task 0");
        return 0;
    })
    .add(async (previousResult, engine) => {
        console.log("task 1");
        console.log("previousResult = ", previousResult);

        engine.raiseError(new Error("custom error"));
        return 1;
    })
    .add(async (previousResult, engine) => {
        console.log("task 2");
        return 2;
    });

chain.run().then(result => {
    console.log("result = ", result);
});
