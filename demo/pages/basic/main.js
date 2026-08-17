// @ts-check
import { Chain } from '@supercat1337/chain';

const outputEl = document.getElementById('output');
const logEl = document.getElementById('log');
const runBtn = document.getElementById('run-btn');
const resetBtn = document.getElementById('reset-btn');

/** @type {Chain<number>} */
let chain = new Chain();

function log(message) {
    logEl.textContent += message + '\n';
    logEl.scrollTop = logEl.scrollHeight;
}

function updateUI(result) {
    outputEl.textContent = result !== null ? String(result) : 'cancelled / error';
}

function reset() {
    chain = new Chain();
    outputEl.textContent = '—';
    logEl.textContent = 'Ready';
}

chain.on('run', () => log('▶️ run'));
chain.on('complete', details => {
    log('✅ complete (result: ' + details.chain.returnValue + ')');
    updateUI(details.chain.returnValue);
});
chain.on('cancel', () => {
    log('❌ cancel');
    updateUI(null);
});
chain.on('error', details => {
    log('⚠️ error: ' + details.error.message);
    updateUI(null);
});
chain.on('fail', () => log('💥 fail'));

chain
    .add(async (prev, c) => {
        log('  task 0: start');
        await c.sleep(300);
        log('  task 0: done');
        return 0;
    })
    .add(async (prev, c) => {
        log('  task 1: prev = ' + prev);
        await c.sleep(200);
        return prev + 1;
    })
    .add(async (prev, c) => {
        log('  task 2: prev = ' + prev);
        return prev + 1;
    });

runBtn.addEventListener('click', async () => {
    // Cancel any previous run
    await chain.cancel();
    log('=== New run ===');
    chain.run().catch(() => {});
});

resetBtn.addEventListener('click', reset);
