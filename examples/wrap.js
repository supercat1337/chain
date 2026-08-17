// @ts-check

import { Chain } from '../src/index.js';

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
    console.log('test (this will be logged even after cancellation)');
}

const chain = new Chain();

chain.add(async (_, chainController) => {
    const fn = chainController.wrap(test);
    await fn();
});

chain.add(async () => {
    console.log('Never executed');
});

console.log('Start');
const runPromise = chain.run();
await sleep(1000);
await chain.cancel();
await runPromise.catch(() => {});
console.log('End');

/* Output:
Start
End
test (this will be logged even after cancellation)
*/
