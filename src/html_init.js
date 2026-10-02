//Tail of the spoofed jinja block. Split from html_vars.js because the game
//files read those vars as they evaluate, while these statements call into the
//game files - so the vars load first and this loads last.

if (!is_sdk) {
  for (var f in log_flags) log_flags[f] = 0;
}

//handle_information() replaces this with the live list
X.servers = [];
X.characters = [];
X.tutorial = { step: 0, completed: [] };
X.unread = 0;
X.codes = {};

// Local/dev game client expects Monaco create_editor; caracAL headless has no Monaco.
if (typeof create_editor !== "function") {
  create_editor = function create_editor_fake(replaceOrHost, options) {
    options = options || {};
    var value = (options && options.value) || "";
    var api = {
      getValue: function () {
        return value;
      },
      setValue: function (x) {
        value = x == null ? "" : String(x);
      },
      focus: function () {},
      layout: function () {},
      refresh: function () {},
      clearHistory: function () {},
      getWrapperElement: function () {
        return { ALEditor: api, CodeMirror: api };
      },
      dispose: function () {},
      on: function () {},
      getCursor: function () {
        return { line: 0, ch: 0 };
      },
      findWordAt: function (c) {
        return { anchor: c || { line: 0, ch: 0 }, head: c || { line: 0, ch: 0 } };
      },
      getRange: function () {
        return "";
      },
    };
    if (typeof replaceOrHost === "function") {
      var host = document.createElement("div");
      host.ALEditor = api;
      host.CodeMirror = api;
      replaceOrHost(host);
    }
    return api;
  };
}

code_logic();
