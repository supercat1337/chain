// @ts-check

import { Chain } from "./../../src/index.js";

/** @type {Map<string, string>} */
const ctx = new Map();

/** @type {Chain<string, typeof ctx>} */
const chain = new Chain(ctx);

const input_element = /** @type {HTMLInputElement} */ (document.querySelector("#input"));
const output_element = /** @type {HTMLDivElement} */ (document.querySelector("#output"));
const status_element = /** @type {HTMLSpanElement} */ (document.querySelector("#status"));
const error_element = /** @type {HTMLDivElement} */ (document.querySelector("#error"));

chain.on("run", () => {
    status_element.textContent = "";
    error_element.textContent = "";
});

chain.on("complete", () => {
    status_element.textContent = "Loaded";
    output_element.textContent = chain.returnValue;
    error_element.textContent = "";
});

chain.on("error", (details) => {
    status_element.textContent = "";
    output_element.textContent = "";
    error_element.textContent = String(details.error?.message || "");
});

chain
    .add(async (previousResult, chainController) => {
        let value = input_element.value;

        if (value === "") {
            throw new Error("Empty input");
        }

        if (!/^\d+$/.test(value)) {
            throw new Error("Not a number");
        }

        await chainController.sleep(2000);

        return value;
    })
    .add(async (value, chainController) => {

        /*
        if (chainController.ctx.hasOwnProperty(value)) {
            chainController.complete(chainController.ctx[value]);
        }
        */

        if (chainController.ctx.has(value)) {
            chainController.complete(chainController.ctx.get(value));
        }

        return value;
    })
    .add(async (value, chainController) => {

        status_element.textContent = "Loading...";
        output_element.textContent = "";

        let response = await chainController.fetch("https://jsonplaceholder.org/comments?id=" + value );
        // same as
        //let response = await fetch("https://jsonplaceholder.org/comments?id=" + value, {signal: chainController.abortController.signal} );
        
        let text = await response.text();
        //chainController.ctx[value] = text;
        chainController.ctx.set(value, text);

        chainController.complete(text);
    });

input_element.addEventListener("keyup", async (event) => {
    await chain.cancel();
    chain.run(0, ctx);
});
