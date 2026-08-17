// @ts-check
import test from 'ava';
import { Chain, CancelError, CompleteError } from '../../src/index.js';

/**
 * Sleeps for the given amount of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

test('ChainController.ctx', async t => {
    const ctx = { foo: 0 };
    const chain = new Chain(ctx);
    chain.add(async (v, c) => {
        c.ctx.foo++;
        return 0;
    });
    chain.add(async (v, c) => {
        c.ctx.foo++;
        return 1;
    });
    await chain.run();
    t.is(chain.ctx.foo, 2);
});

test('ChainController.complete', async t => {
    const chain = new Chain();
    chain
        .add(async () => 0)
        .add(async (v, c) => {
            c.complete(100);
            return 1;
        })
        .add(async () => 2);
    const result = await chain.run();
    t.is(result, 100);
});

test('ChainController.cancel', async t => {
    const chain = new Chain();
    let foo = 0;
    chain
        .add((v, c) => {
            foo++;
            return 0;
        })
        .add((v, c) => {
            foo++;
            c.cancel();
            return 1;
        })
        .add((v, c) => {
            foo++;
            return 2;
        });
    await chain.run();
    t.is(foo, 2);
});

test('ChainController.fetch (abort)', async t => {
    const chain = new Chain();
    let foo = 0;
    chain.add(async (v, c) => {
        const res = c.fetch('https://example.com');
        res.catch(() => foo++);
        c.abortController.abort();
        return await res;
    });
    await chain.run().catch(() => {});
    t.is(foo, 1);
});

test('ChainController.wrap – abort during wrap', async t => {
    let foo = 0;
    const chain = new Chain();
    chain.add(async (v, c) => {
        const fn = c.wrap(async () => await sleep(5000));
        await fn();
    });
    chain.add(async () => {
        foo++;
    });
    chain.run();
    await sleep(1000);
    await chain.cancel();
    t.is(foo, 0);
});

test('ChainController.abortController direct abort', async t => {
    const chain = new Chain();
    let cancelled = false;
    chain.on('cancel', () => {
        cancelled = true;
    });
    chain.add(async (v, c) => {
        c.abortController.abort();
        await c.sleep(10000);
    });
    await chain.run().catch(() => {});
    t.true(cancelled);
});

test('Chain with external signal already aborted', async t => {
    const controller = new AbortController();
    controller.abort();
    const chain = new Chain({}, { signal: controller.signal });
    let cancelled = false;
    chain.on('cancel', () => {
        cancelled = true;
    });
    let taskExecuted = false;
    chain.add(async (v, c) => {
        taskExecuted = true;
        await c.sleep(1000);
    });
    await chain.run().catch(() => {});
    t.true(cancelled);
    t.false(taskExecuted);
});

test('Chain with external signal aborted later', async t => {
    const controller = new AbortController();
    const chain = new Chain({}, { signal: controller.signal });
    let cancelled = false;
    chain.on('cancel', () => {
        cancelled = true;
    });
    chain.add(async (v, c) => {
        await c.sleep(1000);
    });
    const runPromise = chain.run().catch(() => {});
    await sleep(10);
    controller.abort();
    await runPromise;
    t.true(cancelled);
});
