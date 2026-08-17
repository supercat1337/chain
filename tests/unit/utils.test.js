// @ts-check
import test from 'ava';
import { CancelError } from '../../src/errors.js';
import { sleep, wrap } from '../../src/utils.js';

test('sleep utils – without signal', async t => {
    const start = Date.now();
    await sleep(100);
    const end = Date.now();
    t.true(end - start >= 100);
});

test('sleep utils – with signal, not aborted', async t => {
    const controller = new AbortController();
    const start = Date.now();
    await sleep(100, controller.signal);
    const end = Date.now();
    t.true(end - start >= 100);
});

test('sleep utils – already aborted signal', async t => {
    const controller = new AbortController();
    controller.abort();
    try {
        await sleep(1000, controller.signal);
        t.fail('Should have thrown');
    } catch (e) {
        t.true(e instanceof CancelError);
    }
});

test('sleep utils – abort during sleep', async t => {
    const controller = new AbortController();
    const promise = sleep(1000, controller.signal);
    setTimeout(() => controller.abort(), 10);
    try {
        await promise;
        t.fail('Should have thrown');
    } catch (e) {
        t.true(e instanceof CancelError);
    }
});

test('wrap utils – function resolves before abort', async t => {
    const controller = new AbortController();
    const fn = wrap(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 42;
    }, controller.signal);
    const result = await fn();
    t.is(result, 42);
    t.false(controller.signal.aborted);
});

test('wrap utils – function rejects before abort', async t => {
    const controller = new AbortController();
    const fn = wrap(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('test error');
    }, controller.signal);
    try {
        await fn();
        t.fail('Should have thrown');
    } catch (e) {
        t.is(e.message, 'test error');
    }
});

test('wrap utils – already aborted signal', async t => {
    const controller = new AbortController();
    controller.abort();
    const fn = wrap(async () => 42, controller.signal);
    try {
        await fn();
        t.fail('Should have thrown');
    } catch (e) {
        t.true(e instanceof CancelError);
    }
});

test('wrap utils – abort during execution', async t => {
    const controller = new AbortController();
    const fn = wrap(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 42;
    }, controller.signal);
    const promise = fn();
    setTimeout(() => controller.abort(), 10);
    try {
        await promise;
        t.fail('Should have thrown');
    } catch (e) {
        t.true(e instanceof CancelError);
    }
});
