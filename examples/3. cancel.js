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
    .add( (previousResult, chainController) => {
        console.log("task 0");
        return 0;
    })
    .add((previousResult, chainController) => {
        console.log("task 1");
        console.log("previousResult = ", previousResult);

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
