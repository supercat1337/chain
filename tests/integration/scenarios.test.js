// @ts-check
import test from 'ava';
import { Chain } from '../../src/index.js';

test('complex scenario with cancellation and events', async t => {
    const chain = new Chain();
    /** @type {string[]} */
    const log = [];
    chain.on('run', () => log.push('run'));
    chain.on('complete', () => log.push('complete'));
    chain.on('cancel', () => log.push('cancel'));
    chain
        .add(async (v, c) => {
            log.push('task0');
            return 0;
        })
        .add(async (v, c) => {
            log.push('task1');
            c.cancel();
            return 1;
        })
        .add(async (v, c) => {
            log.push('task2');
            return 2;
        });
    await chain.run();
    t.deepEqual(log, ['run', 'task0', 'task1', 'cancel']);
});

test('full chain with sleep and fetch (aborted)', async t => {
    const chain = new Chain();
    let cancelled = false;
    chain.on('cancel', () => {
        cancelled = true;
    });
    chain
        .add(async (v, c) => {
            await c.sleep(100);
            return 1;
        })
        .add(async (v, c) => {
            const res = await c.fetch('https://example.com');
            return res.status;
        });
    const promise = chain.run();
    setTimeout(() => chain.cancel(), 50);
    await promise.catch(() => {});
    t.true(cancelled);
});
