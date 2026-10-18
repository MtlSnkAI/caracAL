const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  follows_latest_client,
  get_game_files,
  get_runner_files,
  get_game_files_fallback,
  get_runner_files_fallback,
} = require("./game_files");

describe("follows_latest_client", () => {
  it("treats missing and 0 as live latest", () => {
    assert.equal(follows_latest_client(undefined), true);
    assert.equal(follows_latest_client(null), true);
    assert.equal(follows_latest_client(0), true);
    assert.equal(follows_latest_client("0"), true);
    assert.equal(follows_latest_client(""), true);
  });

  it("treats numeric and named folders as pinned", () => {
    assert.equal(follows_latest_client(5158), false);
    assert.equal(follows_latest_client("5158"), false);
    assert.equal(follows_latest_client("halflife3"), false);
  });
});

describe("official client script lists", () => {
  it("fallback loads merrit_stand_notice after html.js", () => {
    const files = get_game_files_fallback();
    const html = files.indexOf("/js/html.js");
    const merrit = files.indexOf("/js/merrit_stand_notice.js");
    assert.ok(html >= 0, "html.js required");
    assert.ok(merrit >= 0, "merrit_stand_notice.js required");
    assert.ok(merrit > html, "merrit_stand_notice.js must load after html.js");
  });

  it("fallback runner scripts match /runner", () => {
    assert.deepEqual(get_runner_files_fallback(), [
      "/js/old_common_functions.js",
      "/js/common_functions.js",
      "/js/runner_functions.js",
      "/js/runner_compat.js",
    ]);
  });

  it("get_game_files without version uses fallback", () => {
    assert.deepEqual(get_game_files(), get_game_files_fallback());
    assert.deepEqual(get_runner_files(), get_runner_files_fallback());
  });
});

const { describe: d2, it: i2 } = require("node:test");
d2("locate_game_file", () => {
  i2("keeps a first-party file's folder, the rest by name", () => {
    const gf = require("./game_files");
    const at = (r) => gf.locate_game_file("https://adventure.land", r, 7);
    require("node:assert/strict").deepEqual(
      [
        at("/js/game.js"),
        at("/js/progression/ui.js"),
        at("/phrases/en.js"),
        at("/js/pixi/fake/pixi.min.js"),
      ],
      [
        "./game_files/adventure.land/7/game.js",
        "./game_files/adventure.land/7/progression/ui.js",
        "./game_files/adventure.land/7/phrases/en.js",
        "./game_files/adventure.land/7/pixi.min.js",
      ],
    );
  });
});

describe("game files: safety", () => {
  const fs = require("node:fs"),
    os = require("node:os"),
    path = require("node:path"),
    http = require("node:http");
  const gf = require("./game_files"),
    { resolveGameFilesFromIndexHtml } = require("./client_scripts");
  it("a script path leaving the game's folders is refused, and left out of a page's script list", () => {
    assert.throws(
      () =>
        gf.locate_game_file("https://adventure.land", "/js/../../../x.js", 7),
      /refused/,
    );
    assert.throws(
      () => gf.locate_game_file("https://adventure.land", "/js\\..\\x.js", 7),
      /refused/,
    );
    const list = resolveGameFilesFromIndexHtml(
      '<script src="/js/game.js"></script><script src="/js/../../evil.js"></script>',
    );
    assert.ok(
      list.includes("/js/game.js") && !list.some((s) => s.includes("..")),
    );
  });
  it("a download cut short leaves no file (none that counts as present and runs); a whole one is there", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gf-test-"));
    const srv = http.createServer((req, res) => {
      if (req.url === "/whole.js") return res.end("var whole = 1;");
      res.writeHead(200, { "content-length": "1000" });
      res.write("var half = ");
      setTimeout(() => res.destroy(), 20);
    });
    await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
    const base = `http://127.0.0.1:${srv.address().port}`;
    try {
      await assert.rejects(
        gf.download_file(base + "/cut.js", path.join(dir, "cut.js")),
      );
      assert.deepEqual(
        fs.readdirSync(dir),
        [],
        "neither the file nor its .tmp",
      );
      await gf.download_file(base + "/whole.js", path.join(dir, "whole.js"));
      assert.equal(
        fs.readFileSync(path.join(dir, "whole.js"), "utf8"),
        "var whole = 1;",
      );
    } finally {
      srv.close();
    }
  });
});
