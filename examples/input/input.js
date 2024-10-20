// @ts-check

import { Chain } from "./../../src/index.js";

const chain = new Chain();

const input_element = /** @type {HTMLInputElement} */ (document.querySelector("#input"));
const output_element = /** @type {HTMLDivElement} */ (document.querySelector("#output"));
const status_element = /** @type {HTMLSpanElement} */ (document.querySelector("#status"));
const error_element = /** @type {HTMLDivElement} */ (document.querySelector("#error"));

chain.on("run", () => {
    status_element.textContent = "";
    output_element.textContent = "";
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
    error_element.textContent = String(details.error?.message);
});

chain
    .add(async (previousResult, engine) => {
        let value = input_element.value;

        if (value === "") {
            engine.raiseError(new Error("Empty input"));
        }

        if (!/^\d+$/.test(value)) {
            engine.raiseError(new Error("Not a number"));
        }

        return value;
    })
    .add(async (value, engine) => {
        await engine.sleep(2000);
        status_element.textContent = "Loading...";
        let response = await engine.fetch("https://jsonplaceholder.org/comments?id=" + value );
        let text = await response.text();
        return text;
    });

input_element.addEventListener("input", async (event) => {
    await chain.cancel();
    chain.run();
});
