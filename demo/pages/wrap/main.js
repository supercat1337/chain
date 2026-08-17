// @ts-check
import { Chain, AlreadyRunningError } from '@supercat1337/chain';

const outputEl = document.getElementById('output');
const logEl = document.getElementById('log');
const runBtn = document.getElementById('run-btn');
const cancelBtn = document.getElementById('cancel-btn');
const resetBtn = document.getElementById('reset-btn');

if (!outputEl) throw new Error('Element #output not found');
if (!logEl) throw new Error('Element #log not found');
if (!runBtn) throw new Error('Element #run-btn not found');
if (!cancelBtn) throw new Error('Element #cancel-btn not found');
if (!resetBtn) throw new Error('Element #reset-btn not found');

const chain = new Chain();

chain.on('run', () => (logEl.textContent += 'run\n'));
chain.on('complete', () => (logEl.textContent += 'complete\n'));
chain.on('cancel', () => (logEl.textContent += 'cancel\n'));
chain.on('error', details => {
    logEl.textContent += `error: ${details.error?.message ?? 'Unknown error'}\n`;
});

chain.add(async (prev, ctrl) => {
    logEl.textContent += 'task: wrapping async function\n';
    const wrapped = ctrl.wrap(async () => {
        logEl.textContent += '  wrapped: starting 5s sleep\n';
        await new Promise(r => setTimeout(r, 5000));
        logEl.textContent += '  wrapped: done\n';
        return 'wrapped result';
    });
    const result = await wrapped();
    logEl.textContent += `task: got result: ${result}\n`;
    return result;
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

cancelBtn.addEventListener('click', () => {
    chain.cancel().catch(() => {});
    logEl.textContent += 'Cancel requested (after 1s? do it manually)\n';
});

resetBtn.addEventListener('click', () => {
    outputEl.textContent = '—';
    logEl.textContent = 'Ready\n';
    chain.cancel().catch(() => {});
});
