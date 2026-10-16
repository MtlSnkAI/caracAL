const test = require("node:test");
const assert = require("node:assert");
const { is_loopback, check_base_url, socket_address } = require("./server_url");

test("loopback hosts", () => {
  for (const host of ["localhost", "127.0.0.1", "127.1.2.3", "[::1]"]) {
    assert.ok(is_loopback(host), host);
  }
  for (const host of [
    "adventure.land",
    "192.168.1.2",
    "127.0.0.1.example.com",
    "localhost.example.com",
  ]) {
    assert.ok(!is_loopback(host), host);
  }
});

test("base_url: https always, plain http only on this machine and when allowed", () => {
  check_base_url("https://adventure.land", false);
  check_base_url("https://my.server.example", false);
  check_base_url("http://localhost:8083", true);
  check_base_url("http://127.0.0.1:8083", true);
  assert.throws(
    () => check_base_url("http://localhost:8083", false),
    /allow_local_http/,
  );
  assert.throws(
    () => check_base_url("http://my.server.example", true),
    /refusing plain http/,
  );
  assert.throws(() => check_base_url("ftp://adventure.land", true), /https/);
});

test("game socket: wss unless the base_url is plain http on this machine", () => {
  assert.strictEqual(
    socket_address("https://adventure.land", "eu1.adventure.land"),
    "wss://eu1.adventure.land",
  );
  assert.strictEqual(
    socket_address("https://adventure.land", "wss://eu1.adventure.land"),
    "wss://eu1.adventure.land",
  );
  assert.strictEqual(
    socket_address("http://localhost:8083", "127.0.0.1"),
    "ws://127.0.0.1",
  );
  assert.strictEqual(
    socket_address("http://localhost:8083", "localhost:7200"),
    "ws://localhost:7200",
  );
  assert.throws(
    () => socket_address("http://localhost:8083", "eu1.adventure.land"),
    /unencrypted/,
  );
  assert.throws(
    () => socket_address("https://adventure.land", "ws://127.0.0.1"),
    /unencrypted/,
  );
  assert.throws(
    () => socket_address("http://localhost:8083", "ws://10.0.0.2"),
    /unencrypted/,
  );
});
