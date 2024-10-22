// @ts-check

import { Chain } from "../src/index.js";

/**
 * Sleeps for the given amount of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
    await sleep(5000);
    console.log("test");
}

async function main() {
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
}

main();
