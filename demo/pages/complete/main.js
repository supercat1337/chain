// @ts-check
import { Chain } from '@supercat1337/chain';

const outputEl = document.getElementById('output');
const logEl = document.getElementById('log');
const runBtn = document.getElementById('run-btn');

function log(message) {
    logEl.textContent += message + '\n';
    logEl.scrollTop = logEl.scrollHeight;
}

function updateUI(result) {
    outputEl.textContent = result !== null ? String(result) : 'cancelled / error';
}

const chain = new Chain();

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

chain
    .add(async (prev, c) => {
        log('  task 0: start');
        await c.sleep(200);
        log('  task 0: done');
        return 0;
    })
    .add(async (prev, c) => {
        log('  task 1: start');
        await c.sleep(200);
        log('  task 1: completing with 100');
        c.complete(100);
        return 1; // will be ignored
    })
    .add(async (prev, c) => {
        log('  task 2: start (should not run)');
        return 2;
    });

runBtn.addEventListener('click', () => {
    log('=== New run ===');
    // Reset output
    updateUI(null);
    chain.run().catch(() => {});
});
