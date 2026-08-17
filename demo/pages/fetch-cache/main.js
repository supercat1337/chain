// @ts-check
import { Chain } from '@supercat1337/chain';

const inputEl = document.getElementById('input');
const fetchBtn = document.getElementById('fetch-btn');
const clearCacheBtn = document.getElementById('clear-cache-btn');
const statusEl = document.getElementById('status');
const errorEl = document.getElementById('error');
const outputEl = document.getElementById('output');

/** @type {Map<string, string>} */
const cache = new Map();

/** @type {Chain<string, typeof cache>} */
const chain = new Chain(cache);

function setStatus(text) {
    statusEl.textContent = text;
}

function setError(text) {
    errorEl.textContent = text;
}

function setOutput(text) {
    outputEl.textContent = text;
}

chain.on('run', () => {
    setStatus('🔄 Running...');
    setError('');
    setOutput('');
});

chain.on('complete', details => {
    setStatus('✅ Loaded');
    setOutput(details.chain.returnValue);
});

chain.on('cancel', () => {
    setStatus('⏹️ Cancelled');
});

chain.on('error', details => {
    setStatus('❌ Error');
    setError(String(details.error.message));
});

chain
    .add(async (previousResult, c) => {
        const id = inputEl.value.trim();
        if (!id) throw new Error('Empty input');
        if (!/^\d+$/.test(id)) throw new Error('Not a number');
        const num = Number(id);
        if (num < 1 || num > 21) throw new Error('ID out of range (1–21)');

        // Debounce: sleep 500ms to avoid rapid requests
        await c.sleep(500);

        return id;
    })
    .add(async (id, c) => {
        // Check cache
        if (c.ctx.has(id)) {
            c.complete(c.ctx.get(id));
        }
        return id;
    })
    .add(async (id, c) => {
        // Fetch
        const url = 'https://jsonplaceholder.org/comments?id=' + id;
        setStatus('⏳ Loading...');
        const response = await c.fetch(url);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const text = await response.text();
        // Store in cache
        c.ctx.set(id, text);
        c.complete(text);
    });

async function fetchComment() {
    await chain.cancel();
    chain.run().catch(() => {});
}

fetchBtn.addEventListener('click', fetchComment);

inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') fetchComment();
});

clearCacheBtn.addEventListener('click', () => {
    cache.clear();
    setStatus('🗑️ Cache cleared');
    setOutput('');
    setError('');
});
