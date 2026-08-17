// @ts-check

import { Chain } from '../src/index.js';

const chain = new Chain();

chain.on('complete', () => console.log('complete'));
chain.on('cancel', () => console.log('cancel'));
chain.on('error', e => console.log('error', e));
chain.on('run', () => console.log('run'));

chain
    .add(async previousResult => {
        console.log('task 0');
        return 0;
    })
    .add(async (previousResult, chainController) => {
        console.log('task 1');
        console.log('previousResult = ', previousResult);
        await chainController.sleep(10000);
        return 1;
    })
    .add(async () => {
        console.log('task 2 (never executed)');
        return 2;
    });

const runPromise = chain.run();
await chain.cancel(); // cancel immediately
const result = await runPromise;
console.log('result = ', result);

/* Output:
run
task 0
cancel
result = null
*/
