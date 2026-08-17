// @ts-check
import { Chain } from '@supercat1337/chain';

const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const startBtn = document.getElementById('start-btn');
const cancelBtn = document.getElementById('cancel-btn');

/** @type {Chain<number>} */
let chain = new Chain();

function log(message) {
    logEl.textContent += message + '\n';
    logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(text) {
    statusEl.textContent = text;
}

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
chain.on('fail', () => log('💥 fail'));

chain
    .add(async (prev, c) => {
        log('  task 0: start');
        await c.sleep(500);
        log('  task 0: done');
        return 0;
    })
    .add(async (prev, c) => {
        log('  task 1: start (long sleep)');
        await c.sleep(10000);
        log('  task 1: done');
        return 1;
    })
    .add(async (prev, c) => {
        log('  task 2: start');
        return 2;
    });

startBtn.addEventListener('click', async () => {
    await chain.cancel();
    log('=== New run ===');
    chain = new Chain(); // fresh chain to reset state
    // Re‑attach listeners
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
    chain.on('fail', () => log('💥 fail'));
    // Re‑add tasks
    chain
        .add(async (prev, c) => {
            log('  task 0: start');
            await c.sleep(500);
            log('  task 0: done');
            return 0;
        })
        .add(async (prev, c) => {
            log('  task 1: start (long sleep)');
            await c.sleep(10000);
            log('  task 1: done');
            return 1;
        })
        .add(async (prev, c) => {
            log('  task 2: start');
            return 2;
        });
    chain.run().catch(() => {});
});

cancelBtn.addEventListener('click', async () => {
    log('⏹️ manual cancel requested');
    await chain.cancel();
});
