// @ts-check

import { Chain } from '../src/index.js';

const chain = new Chain();

chain.on('complete', () => console.log('complete'));
chain.on('cancel', () => console.log('cancel'));
chain.on('error', e => console.log('error', e));
chain.on('run', () => console.log('run'));

chain
    .add(previousResult => {
        console.log('task 0');
        return 0;
    })
    .add((previousResult, chainController) => {
        console.log('task 1');
        console.log('previousResult = ', previousResult);
        chainController.cancel();
        return 1;
    })
    .add(() => {
        console.log('task 2 (never executed)');
        return 2;
    });

const result = await chain.run();
console.log('result = ', result);

/* Output:
run
task 0
task 1
previousResult = 0
cancel
result = null
*/
