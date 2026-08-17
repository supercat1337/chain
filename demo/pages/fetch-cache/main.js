// @ts-check
import { Chain, AlreadyRunningError } from '@supercat1337/chain';

const inputEl = document.getElementById('input');
const fetchBtn = document.getElementById('fetch-btn');
const cancelBtn = document.getElementById('cancel-btn');
const resetBtn = document.getElementById('reset-btn');
const statusEl = document.getElementById('status');
const outputEl = document.getElementById('output');
const logEl = document.getElementById('log');
const cacheHitsEl = document.getElementById('cache-hits');

if (!inputEl) throw new Error('Element #input not found');
if (!fetchBtn) throw new Error('Element #fetch-btn not found');
if (!cancelBtn) throw new Error('Element #cancel-btn not found');
if (!resetBtn) throw new Error('Element #reset-btn not found');
if (!statusEl) throw new Error('Element #status not found');
if (!outputEl) throw new Error('Element #output not found');
if (!logEl) throw new Error('Element #log not found');
if (!cacheHitsEl) throw new Error('Element #cache-hits not found');

/** @type {Map<string, string>} */
const cache = new Map();

/** @type {Chain<string, typeof cache>} */
const chain = new Chain(cache);

chain.on('run', () => {
    statusEl.textContent = 'Running...';
    logEl.textContent += 'run\n';
});
chain.on('complete', () => {
    statusEl.textContent = 'Completed';
    logEl.textContent += 'complete\n';
    outputEl.textContent = chain.returnValue;
});
chain.on('cancel', () => {
    statusEl.textContent = 'Cancelled';
    logEl.textContent += 'cancel\n';
});
chain.on('error', details => {
    statusEl.textContent = 'Error';
    logEl.textContent += `error: ${details.error?.message ?? 'Unknown error'}\n`;
    outputEl.textContent = `Error: ${details.error?.message ?? 'Unknown error'}`;
});

chain
    .add(async (prev, ctrl) => {
        const id = inputEl.value;
        if (!id || id < 1 || id > 100) {
            throw new Error('Invalid post ID (1–100)');
        }
        logEl.textContent += `task 0: validating ID ${id}\n`;
        return id;
    })
    .add(async (id, ctrl) => {
        if (ctrl.ctx.has(id)) {
            logEl.textContent += `task 1: cache hit for ${id}, completing with cached value\n`;
            ctrl.complete(ctrl.ctx.get(id));
        }
        logEl.textContent += `task 1: cache miss, proceeding to fetch\n`;
        return id;
    })
    .add(async (id, ctrl) => {
        logEl.textContent += `task 2: fetching post ${id}\n`;
        const url = `https://jsonplaceholder.typicode.com/posts/${id}`;
        const response = await ctrl.fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        ctrl.ctx.set(id, text);
        cacheHitsEl.textContent = String(ctrl.ctx.size);
        logEl.textContent += `task 2: fetched and cached\n`;
        ctrl.complete(text);
    });

fetchBtn.addEventListener('click', async () => {
    outputEl.textContent = '…';
    statusEl.textContent = 'Starting...';
    logEl.textContent = 'Starting...\n';
    try {
        await chain.run();
    } catch (err) {
        if (err instanceof AlreadyRunningError) {
            logEl.textContent += 'Already running\n';
            statusEl.textContent = 'Already running';
        } else {
            // Other errors are handled by the 'error' event
        }
    }
});

cancelBtn.addEventListener('click', () => {
    chain.cancel().catch(() => {});
    logEl.textContent += 'Cancel requested\n';
});

resetBtn.addEventListener('click', () => {
    outputEl.textContent = '—';
    statusEl.textContent = 'Idle';
    logEl.textContent = 'Ready\n';
    cache.clear();
    cacheHitsEl.textContent = '0';
    chain.cancel().catch(() => {});
});
