// @ts-check
import { Chain } from '@supercat1337/chain';

const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const startBtn = document.getElementById('start-btn');
const cancelBtn = document.getElementById('cancel-btn');

function log(message) {
    logEl.textContent += message + '\n';
    logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(text) {
    statusEl.textContent = text;
}

/** @type {Chain<void>} */
let chain = new Chain();

// Async function that takes 5 seconds
async function slowFunction() {
    log('  ⏳ slowFunction: start (5s)');
    await new Promise(resolve => setTimeout(resolve, 5000));
    log('  ✅ slowFunction: done');
    return 'done';
}

function setupChain() {
    chain = new Chain();
    chain.on('run', () => {
        setStatus('▶️ Running');
        log('🟢 run');
    });
    chain.on('complete', () => {
        setStatus('✅ Complete');
        log('✅ complete');
    });
    chain.on('cancel', () => {
        setStatus('⏹️ Cancelled');
        log('❌ cancel');
    });
    chain.on('error', details => {
        setStatus('❌ Error: ' + details.error.message);
        log('⚠️ error: ' + details.error.message);
    });

    chain
        .add(async (prev, c) => {
            log('  task 0: start');
            const wrapped = c.wrap(slowFunction);
            log('  task 0: calling wrapped function');
            const result = await wrapped();
            log('  task 0: result = ' + result);
            return result;
        })
        .add(async (prev, c) => {
            log('  task 1: this will not run if cancelled');
            return 'task1';
        });
}

startBtn.addEventListener('click', async () => {
    await chain.cancel();
    log('=== New run ===');
    setupChain();
    chain.run().catch(() => {});
});

cancelBtn.addEventListener('click', async () => {
    log('⏹️ manual cancel requested');
    await chain.cancel();
});
