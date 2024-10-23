// @ts-check

import test from "./../node_modules/ava/entrypoints/main.mjs";
import { Chain } from "./../src/index.js";

/**
 * Sleeps for the given amount of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Returns the state of the given promise.
 * @param {Promise<any>} p
 * @returns {Promise<"pending"|"fulfilled"|"rejected">}
 */
function promiseState(p) {
    const t = {};
    return Promise.race([p, t])
        .then(v => (v === t) ? "pending" : "fulfilled", () => "rejected");
}

test("base example", async (t) => {
    /** @type {Chain<number>} */
    const chain = new Chain();

    chain
        .add(async (previousResult, chainController) => {
            console.log("task 0");
            return 0;
        })
        .add(async (previousResult, chainController) => {
            console.log("task 1");
            console.log("previousResult = ", previousResult);
            return 1;
        })
        .add(async (previousResult, chainController) => {
            console.log("task 2");
            return 2;
        });

    let result = await chain.run();
    if (result == 2 && chain.returnValue == 2 && chain.completedSuccessfully && chain.isRunning == false) {
        t.pass();
    }
    else {
        t.fail();
    }
});

test("chainController.complete", async (t) => {
    /**
     * @type {Chain<number>}
     */
    const chain = new Chain();

    chain
        .add(async (previousResult, chainController) => {
            return 0;
        })
        .add(async (previousResult, chainController) => {
            chainController.complete(100);
            return 1;
        })
        .add(async (previousResult, chainController) => {
            return 2;
        });

    let result = await chain.run();
    if (result == 100) {
        t.pass();
    }
    else {
        t.fail();
    }
}
);

test("chainController.cancel", async (t) => {

    const chain = new Chain();
    let foo = 0;

    chain
        .add((previousResult, chainController) => {
            foo++;
            return 0;
        })
        .add((previousResult, chainController) => {
            foo++;

            chainController.cancel();
            return 1;
        })
        .add((previousResult, chainController) => {
            foo++;
            return 2;
        });

    await chain.run();

    if (foo == 2) {
        t.pass();
    } else {
        t.fail();
    }

});

test("chainController.sleep, chain.cancel", async (t) => {
    /** @type {Chain<number>} */
    const chain = new Chain();
    let start = Date.now();

    chain.on("cancel", () => {
        let end = Date.now();
        if (end - start > 5000) {
            t.fail();
        }
        else {
            t.pass();
        };
    });

    chain
        .add(async (previousResult, chainController) => {
            await chainController.sleep(10000);
            return 0;
        })
        .add(async (previousResult, chainController) => {
            await chainController.sleep(10000);
            return 1;
        })
        .add(async (previousResult, chainController) => {
            return 2;
        });

    chain.run().then(result => {
        console.log("result = ", result);
    });

    await sleep(2000);
    chain.cancel();
});

test("chain.waitForChainToFinish", async (t) => {
    const chain = new Chain();
    let result = 0;
    chain
        .add(async (previousResult, chainController) => {
            await chainController.sleep(100);
            result = 1;
            return 1;
        })
        .add(async (previousResult, chainController) => {
            await chainController.sleep(100);
            result = 2;
            return 2;
        })
        .add(async (previousResult, chainController) => {
            await chainController.sleep(100);
            result = 3;
            return 3;
        });

    chain.run();
    await chain.waitForChainToFinish();

    if (result == 3) {
        t.pass();
    }
    else {
        t.fail();
    }
});

test("chainController.ctx", async (t) => {
    const chain = new Chain();
    const ctx = { foo: 0 };

    chain
        .add(async (previousResult, chainController) => {
            chainController.ctx.foo++;
            return 0;
        })
        .add(async (previousResult, chainController) => {
            chainController.ctx.foo++;
            return 1;
        });

    await chain.run(0, ctx);

    if (chain.ctx.foo == 2) {
        t.pass();
    }
    else {
        t.fail();
    }
});


test("chain set ctx in constructor", async (t) => {
    /** @type {{foo: number}} */
    const ctx = { foo: 0 };

    /** @type {Chain<number, typeof ctx>} */
    const chain = new Chain(ctx);

    chain
        .add(async (previousResult, chainController) => {
            chainController.ctx.foo++;
            return 0;
        })
        .add(async (previousResult, chainController) => {
            chainController.ctx.foo++;
            return 1;
        });

    await chain.run();

    if (chain.ctx.foo == 2) {
        t.pass();
    }
    else {
        t.fail();
    }
});

test("chain.run (while chain is already running)", async (t) => {
    const chain = new Chain();
    let foo = 0;

    chain.on("error", (e) => {
        foo++;
    });

    chain
        .add(async (previousResult, chainController) => {
            await chainController.sleep(1000);
            return 0;
        })
        .add(async (previousResult, chainController) => {
            await chainController.sleep(1000);
            return 1;
        });

    chain.run();
    chain.run();

    await chain.waitForChainToFinish();

    if (foo == 1) {
        t.pass();
    }
    else {
        t.fail();
    }
});

test("chainController.abortController", async (t) => {
    const chain = new Chain();
    let start = Date.now();

    chain.on("cancel", () => {
        let end = Date.now();
        if (end - start > 5000) {
            t.fail();
        }
        else {
            t.pass();
        };
    });

    chain
        .add(async (previousResult, chainController) => {
            chainController.abortController.abort();
            return 0;
        })
        .add(async (previousResult, chainController) => {
            await chainController.sleep(10000);
            return 1;
        })
        .add(async (previousResult, chainController) => {
            return 2;
        });

    chain.run().then(result => {
        console.log("result = ", result);
    });

    await sleep(2000);
    chain.cancel();
});

test("chainController.fetch", async (t) => {
    const chain = new Chain();
    let foo = 0;

    chain.on("cancel", () => {
        t.log("cancel");
    });

    chain
        .add(async (previousResult, chainController) => {
            let res = chainController.fetch("https://example.com");

            res.catch(e => {
                foo++;
            });

            chainController.abortController.abort();
            return await res;
        });

    await chain.run();

    if (foo == 1) {
        t.pass();
    }
    else {
        t.fail();
    }

});

test("chainController.wrap", async (t) => {
    async function test() {
        await sleep(5000);
    }

    let foo = 0;

    const chain = new Chain();

    chain.add(async (v, chainController) => {
        let fn = chainController.wrap(test);
        await fn();
    });

    chain.add(async () => {
        foo++;
    });

    chain.run();
    await sleep(1000);
    await chain.cancel();

    if (foo == 0) {
        t.pass();
    }
    else {
        t.fail();
    }
});

test("abort() before fetch", async (t) => {

    let foo = 0;

    const chain = new Chain();

    chain.add(async (v, chainController) => {
        chainController.abortController.abort();
        await chainController.fetch("https://example.com");
        foo++;
    });

    chain.add(async () => {
        foo++;
    });

    await chain.run();

    if (foo == 0) {
        t.pass();
    }
    else {
        t.fail();
    }
});

test("abort() before wrap", async (t) => {

    let foo = 0;

    const chain = new Chain();

    chain.add(async (v, chainController) => {
        chainController.abortController.abort();
        await chainController.wrap(sleep)(1000);
        foo++;
    });

    chain.add(async () => {
        foo++;
    });

    await chain.run();

    if (foo == 0) {
        t.pass();
    }
    else {
        t.fail();
    }
});

test("abort() before sleep", async (t) => {

    let foo = 0;

    const chain = new Chain();

    chain.add(async (v, chainController) => {
        chainController.abortController.abort();
        await chainController.sleep(1000);
        foo++;
    });

    chain.add(async () => {
        foo++;
    });

    await chain.run();

    if (foo == 0) {
        t.pass();
    }
    else {
        t.fail();
    }
});