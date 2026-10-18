const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const vm = require("vm");

describe("html_vars", () => {
  it("defines proximity_guides before html.js render_server runs", () => {
    const vars = fs.readFileSync("./src/html_vars.js", "utf8");
    const context = { globalThis: {} };
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(vars, context);
    assert.equal("proximity_guides" in context, true);
  });
});
