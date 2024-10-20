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

test("base", async (t) => {
    const chain = new Chain();

    chain
        .add(async (previousResult, engine) => {
            console.log("task 0");
            return 0;
        })
        .add(async (previousResult, engine) => {
            console.log("task 1");
            console.log("previousResult = ", previousResult);
            return 1;
        })
        .add(async (previousResult, engine) => {
            console.log("task 2");
            return 2;
        });

    let result = await chain.run();
    if (result == 2) {
        t.pass();
    }
    else {
        t.fail();
    }
});

test("engine.complete", async (t) => {
    const chain = new Chain();

    chain
        .add(async (previousResult, engine) => {
            return 0;
        })
        .add(async (previousResult, engine) => {
            engine.complete(100);
            return 1;
        })
        .add(async (previousResult, engine) => {
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

test("engine.cancel", async (t) => {

    const chain = new Chain();
    let foo = 0;

    chain
        .add((previousResult, engine) => {
            foo++;
            return 0;
        })
        .add((previousResult, engine) => {
            foo++;

            engine.cancel();
            return 1;
        })
        .add((previousResult, engine) => {
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

test("engine.raiseError", async (t) => {
    const chain = new Chain();
    let foo = 0;
    let bar = 0;

    chain.on("error", (e) => {
        bar++;
    });

    chain
        .add((previousResult, engine) => {
            foo++;
            return 0;
        })
        .add((previousResult, engine) => {
            engine.raiseError(new Error("custom error"));
            foo++;
            return 1;
        })
        .add((previousResult, engine) => {
            foo++;
            return 2;
        });

    await chain.run();

    if (foo == 1 && bar == 1) {
        t.pass();
    } else {
        t.fail(`foo = ${foo}, bar = ${bar}`);
    };

});

test("engine.sleep, chain.cancel", async (t) => {
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
        .add(async (previousResult, engine) => {
            await engine.sleep(10000);
            return 0;
        })
        .add(async (previousResult, engine) => {
            await engine.sleep(10000);
            return 1;
        })
        .add(async (previousResult, engine) => {
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
        .add(async (previousResult, engine) => {
            await engine.sleep(100);
            result = 1;
            return 1;
        })
        .add(async (previousResult, engine) => {
            await engine.sleep(100);
            result = 2;
            return 2;
        })
        .add(async (previousResult, engine) => {
            await engine.sleep(100);
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

test("chain.getCtx", async (t) => {
    const chain = new Chain();
    const ctx = { foo: 0 };

    chain
        .add(async (previousResult, engine) => {
            engine.ctx.foo++;
            return 0;
        })
        .add(async (previousResult, engine) => {
            engine.ctx.foo++;
            return 1;
        });

    await chain.run(ctx);

    if (chain.getCtx().foo == 2) {
        t.pass();
    }
    else {
        t.fail();
    }
});

test("chain.run (while chain is already running)", async (t) => {
    const chain = new Chain();
    chain
        .add(async (previousResult, engine) => {
            await engine.sleep(1000);
            return 0;
        })
        .add(async (previousResult, engine) => {
            await engine.sleep(1000);
            return 1;
        });

    chain.run();

    chain.run().catch(e => {
        console.log(e);
        return t.pass();
    });

    await chain.waitForChainToFinish();
});

test("engine.abortController", async (t) => {
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
        .add(async (previousResult, engine) => {
            engine.abortController.abort();
            return 0;
        })
        .add(async (previousResult, engine) => {
            await engine.sleep(10000);
            return 1;
        })
        .add(async (previousResult, engine) => {
            return 2;
        });

    chain.run().then(result => {
        console.log("result = ", result);
    });

    await sleep(2000);
    chain.cancel();
});

test("engine.fetch", async (t) => {
    const chain = new Chain();
    let foo = 0;

    chain.on("cancel", () => {
        t.log("cancel");
    });

    chain
        .add(async (previousResult, engine) => {
            let res = engine.fetch("https://example.com");

            res.catch(e => {
                foo++;
            });

            engine.abortController.abort();
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