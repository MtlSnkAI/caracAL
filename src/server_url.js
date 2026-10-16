//plain http sends the session and all game traffic unencrypted,
//so caracAL only uses it for a server on this machine, and only when the config asks for it
function is_loopback(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "[::1]" ||
    /^127(\.\d{1,3}){3}$/.test(hostname)
  );
}

function check_base_url(base_url, allow_local_http) {
  const url = new URL(base_url);
  if (url.protocol === "https:") {
    return;
  }
  if (url.protocol !== "http:") {
    throw new Error(`base_url ${base_url} must start with https://`);
  }
  if (!is_loopback(url.hostname)) {
    throw new Error(
      `refusing plain http to ${url.hostname}: only a server on this machine (localhost) may be reached without https`,
    );
  }
  if (!allow_local_http) {
    throw new Error(
      `base_url ${base_url} is plain http: set allow_local_http: true in your config to use a server on this machine without https`,
    );
  }
}

//the address the game socket connects to, in the scheme base_url allows
function socket_address(base_url, realm_host) {
  const plain = /^ws:\/\//i.test(realm_host);
  if (/^wss:\/\//i.test(realm_host)) {
    return realm_host;
  }
  const host = realm_host.replace(/^ws:\/\//i, "");
  if (!plain && !base_url.startsWith("http://")) {
    return "wss://" + host;
  }
  const hostname = new URL("ws://" + host).hostname;
  if (!base_url.startsWith("http://") || !is_loopback(hostname)) {
    throw new Error(
      `refusing an unencrypted game socket to ${hostname}: only a server on this machine may be reached without https`,
    );
  }
  return "ws://" + host;
}

exports.is_loopback = is_loopback;
exports.check_base_url = check_base_url;
exports.socket_address = socket_address;
