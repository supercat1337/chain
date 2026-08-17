// @ts-check
import test from 'ava';
import { Chain, CancelError, CompleteError, AlreadyRunningError } from '../../src/index.js';

/**
 * Sleeps for the given amount of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

test('base example', async t => {
    const chain = new Chain();
    chain
        .add(async () => 0)
        .add(async prev => 1)
        .add(async prev => 2);
    const result = await chain.run();
    t.is(result, 2);
    t.is(chain.returnValue, 2);
    t.true(chain.completedSuccessfully);
    t.false(chain.isRunning);
});

test('chainController.sleep, chain.cancel', async t => {
    const chain = new Chain();
    let start = Date.now();
    let cancelled = false;
    chain.on('cancel', () => {
        cancelled = true;
        t.true(Date.now() - start < 5000);
    });
    chain.add(async (v, c) => {
        await c.sleep(10000);
        return 0;
    });
    chain.add(async (v, c) => {
        await c.sleep(10000);
        return 1;
    });
    chain.run().catch(() => {});
    await sleep(2000);
    await chain.cancel();
    t.true(cancelled);
});

test('chain.waitForChainToFinish', async t => {
    const chain = new Chain();
    let result = 0;
    chain
        .add(async (v, c) => {
            await c.sleep(100);
            result = 1;
            return 1;
        })
        .add(async (v, c) => {
            await c.sleep(100);
            result = 2;
            return 2;
        })
        .add(async (v, c) => {
            await c.sleep(100);
            result = 3;
            return 3;
        });
    chain.run();
    await chain.waitForChainToFinish();
    t.is(result, 3);
});

test('chain.waitForChainToFinish (error)', async t => {
    const chain = new Chain();
    let result = 0;
    chain
        .add(async (v, c) => {
            await c.sleep(100);
            result = 1;
            return 1;
        })
        .add(async () => {
            throw new Error('foo');
        })
        .add(async (v, c) => {
            await c.sleep(100);
            result = 3;
            return 3;
        });
    chain.run();
    await chain.waitForChainToFinish();
    t.is(result, 1);
});

test('chain.waitForChainToFinish (not bubbling)', async t => {
    const chain = new Chain();
    let result = 0;
    chain
        .add(async (v, c) => {
            await c.sleep(100);
            result = 1;
            return 1;
        })
        .add(async () => {
            throw new Error('foo');
        })
        .add(async (v, c) => {
            await c.sleep(100);
            result = 3;
            return 3;
        });
    await chain.run();
    await chain.waitForChainToFinish();
    t.is(result, 1);
});

test('chain set ctx in constructor', async t => {
    const ctx = { foo: 0 };
    const chain = new Chain(ctx);
    chain
        .add(async (v, c) => {
            c.ctx.foo++;
            return 0;
        })
        .add(async (v, c) => {
            c.ctx.foo++;
            return 1;
        });
    await chain.run();
    t.is(chain.ctx.foo, 2);
});

test('chain.run (while chain is already running) throws AlreadyRunningError', async t => {
    const chain = new Chain();
    let errorCaught = false;
    chain.add(async (v, c) => await c.sleep(1000)).add(async (v, c) => await c.sleep(1000));
    chain.run(); // не ждём
    try {
        await chain.run();
    } catch (e) {
        if (e instanceof AlreadyRunningError) errorCaught = true;
    }
    await chain.waitForChainToFinish();
    t.true(errorCaught);
});

test('chain throws arbitrary error', async t => {
    const chain = new Chain();
    let errorCaught = false;
    chain.on('error', details => {
        if (details.error?.message === 'arbitrary') errorCaught = true;
    });
    chain.add(() => {
        throw new Error('arbitrary');
    });
    await chain.run();
    t.true(errorCaught);
});

test('abort() before fetch', async t => {
    const chain = new Chain();
    let foo = 0;
    chain.add(async (v, c) => {
        c.abortController.abort();
        await c.fetch('https://example.com');
        foo++;
    });
    chain.add(async () => {
        foo++;
    });
    await chain.run();
    t.is(foo, 0);
});

test('abort() before wrap', async t => {
    const chain = new Chain();
    let foo = 0;
    chain.add(async (v, c) => {
        c.abortController.abort();
        await c.wrap(sleep)(1000);
        foo++;
    });
    chain.add(async () => {
        foo++;
    });
    await chain.run();
    t.is(foo, 0);
});

test('abort() before sleep', async t => {
    const chain = new Chain();
    let foo = 0;
    chain.add(async (v, c) => {
        c.abortController.abort();
        await c.sleep(1000);
        foo++;
    });
    chain.add(async () => {
        foo++;
    });
    await chain.run();
    t.is(foo, 0);
});
