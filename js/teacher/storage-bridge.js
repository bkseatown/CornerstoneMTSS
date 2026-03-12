(function storageBridgeModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root || globalThis);
    return;
  }
  root.CSStorageBridge = factory(root);
})(typeof globalThis !== "undefined" ? globalThis : window, function createStorageBridge(root) {
  "use strict";

  var config = root.CS_CONFIG || {};
  var endpoint = typeof config.storageEndpoint === "string" ? config.storageEndpoint.trim() : "";
  var authToken = typeof config.storageAuthToken === "string" ? config.storageAuthToken.trim() : "";
  var cache = {};
  var hydrated = false;

  function isConfigured() {
    return !!endpoint;
  }

  function headers(extra) {
    var out = Object.assign({ "Content-Type": "application/json" }, extra || {});
    if (authToken) out.Authorization = "Bearer " + authToken;
    return out;
  }

  function hydrate() {
    if (!isConfigured() || hydrated || typeof fetch !== "function") return Promise.resolve({});
    hydrated = true;
    return fetch(endpoint.replace(/\/$/, "") + "/snapshot", {
      method: "GET",
      headers: headers()
    }).then(function (response) {
      if (!response.ok) throw new Error("Storage bridge snapshot failed: " + response.status);
      return response.json();
    }).then(function (payload) {
      cache = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
      return cache;
    }).catch(function () {
      hydrated = false;
      return {};
    });
  }

  function get(key) {
    return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : undefined;
  }

  function set(key, value) {
    if (!key || !isConfigured() || typeof fetch !== "function") {
      if (key) cache[key] = value;
      return Promise.resolve(false);
    }
    cache[key] = value;
    return fetch(endpoint.replace(/\/$/, "") + "/item", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ key: key, value: value })
    }).then(function (response) {
      return response.ok;
    }).catch(function () {
      return false;
    });
  }

  function remove(key) {
    if (!key) return Promise.resolve(false);
    delete cache[key];
    if (!isConfigured() || typeof fetch !== "function") return Promise.resolve(false);
    return fetch(endpoint.replace(/\/$/, "") + "/item?key=" + encodeURIComponent(key), {
      method: "DELETE",
      headers: headers()
    }).then(function (response) {
      return response.ok;
    }).catch(function () {
      return false;
    });
  }

  hydrate();

  return {
    isConfigured: isConfigured,
    hydrate: hydrate,
    get: get,
    set: set,
    remove: remove
  };
});
