// @ts-check
import { Chain, AlreadyRunningError } from '@supercat1337/chain';

const outputEl = document.getElementById('output');
const logEl = document.getElementById('log');
const runBtn = document.getElementById('run-btn');
const resetBtn = document.getElementById('reset-btn');

if (!outputEl) throw new Error('Element #output not found');
if (!logEl) throw new Error('Element #log not found');
if (!runBtn) throw new Error('Element #run-btn not found');
if (!resetBtn) throw new Error('Element #reset-btn not found');

const chain = new Chain();

chain.on('run', () => (logEl.textContent += 'run\n'));
chain.on('complete', () => (logEl.textContent += 'complete\n'));
chain.on('cancel', () => (logEl.textContent += 'cancel\n'));
chain.on('error', details => {
    logEl.textContent += `error: ${details.error?.message ?? 'Unknown error'}\n`;
});

chain
    .add(async (prev, ctrl) => {
        logEl.textContent += 'task 0: start\n';
        await ctrl.sleep(500);
        logEl.textContent += 'task 0: done, returning 1\n';
        return 1;
    })
    .add(async (prev, ctrl) => {
        logEl.textContent += `task 1: start (prev=${prev})\n`;
        await ctrl.sleep(500);
        logEl.textContent += `task 1: completing with 100\n`;
        ctrl.complete(100); // Skip remaining tasks
        return 2;
    })
    .add(async (prev, ctrl) => {
        logEl.textContent += `task 2: start (prev=${prev}) – never executed\n`;
        await ctrl.sleep(500);
        return prev + 1;
    });

runBtn.addEventListener('click', async () => {
    outputEl.textContent = '…';
    logEl.textContent = 'Starting...\n';
    try {
        const result = await chain.run();
        outputEl.textContent = String(result);
    } catch (err) {
        if (err instanceof AlreadyRunningError) {
            logEl.textContent += 'Already running\n';
            outputEl.textContent = 'Already running';
        } else {
            logEl.textContent += `Unexpected error: ${err.message}\n`;
            outputEl.textContent = 'Error';
        }
    }
});

resetBtn.addEventListener('click', () => {
    outputEl.textContent = '—';
    logEl.textContent = 'Ready\n';
    chain.cancel().catch(() => {});
});
