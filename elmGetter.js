// ==UserScript==
// @name         ElementGetter
// @author       cxxjackie
// @version      2.0.0
// @supportURL   https://bbs.tampermonkey.net.cn/thread-2726-1-1.html
// ==/UserScript==
var elmGetter = (function () {
  const win = window.unsafeWindow || document.defaultView || window;
  const doc = win.document;
  const listeners = new WeakMap();
  let mode = "css";
  let $;
  const elProto = win.Element.prototype;
  const matches =
    elProto.matches ||
    elProto.matchesSelector ||
    elProto.webkitMatchesSelector ||
    elProto.mozMatchesSelector ||
    elProto.oMatchesSelector;
  const MutationObs =
    win.MutationObserver ||
    win.WebkitMutationObserver ||
    win.MozMutationObserver;

  function addObserver(target, callback) {
    const observer = new MutationObs((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" || mutation.addedNodes.length) {
          callback(mutation.target);
        }
      }
    });
    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    return () => observer.disconnect();
  }

  function addFilter(target, filter) {
    let listener = listeners.get(target);
    if (!listener) {
      listener = {
        filters: new Set(),
        remove: addObserver(target, (el) =>
          listener.filters.forEach((f) => f(el))
        ),
      };
      listeners.set(target, listener);
    }
    listener.filters.add(filter);
  }

  function removeFilter(target, filter) {
    const listener = listeners.get(target);
    if (listener) {
      listener.filters.delete(filter);
      if (!listener.filters.size) {
        listener.remove();
        listeners.delete(target);
      }
    }
  }

  function query(all, selector, parent, includeParent, curMode) {
    switch (curMode) {
      case "css":
        const checkParent = includeParent && matches.call(parent, selector);
        return all
          ? Array.from(parent.querySelectorAll(selector), (el) =>
              checkParent ? [parent].concat(el) : el
            )
          : checkParent
          ? parent
          : parent.querySelector(selector);
      case "jquery":
        let jNodes = $(includeParent ? parent : []);
        jNodes = jNodes.add([...parent.querySelectorAll("*")]).filter(selector);
        return all
          ? $.map(jNodes, (el) => $(el))
          : jNodes.length
          ? $(jNodes[0])
          : null;
      case "xpath":
        const ownerDoc = parent.ownerDocument || parent;
        const xPathResult = ownerDoc.evaluate(
          selector + "/self::*",
          parent,
          null,
          all ? 7 : 9,
          null
        );
        return all
          ? Array.from({ length: xPathResult.snapshotLength }, (_, i) =>
              xPathResult.snapshotItem(i)
            )
          : xPathResult.singleNodeValue;
    }
  }

  function getOne(selector, parent, timeout) {
    return new Promise((resolve) => {
      const node = query(false, selector, parent, false, mode);
      if (node) return resolve(node);

      const filter = (el) => {
        const found = query(false, selector, el, true, mode);
        if (found) {
          removeFilter(parent, filter);
          resolve(found);
        }
      };
      addFilter(parent, filter);
      if (timeout > 0) {
        const timer = setTimeout(() => {
          removeFilter(parent, filter);
          resolve(null);
        }, timeout);
      }
    });
  }

  return {
    get currentSelector() {
      return mode;
    },
    get(selector, ...args) {
      let parent = (typeof args[0] !== "number" && args.shift()) || doc;
      const timeout = args[0] || 0;
      if (Array.isArray(selector)) {
        return Promise.all(selector.map((s) => getOne(s, parent, timeout)));
      }
      return getOne(selector, parent, timeout);
    },
    each(selector, ...args) {
      let parent = (typeof args[0] !== "function" && args.shift()) || doc;
      const callback = args[0];
      for (const node of query(true, selector, parent, false, mode)) {
        if (callback(node) === false) break;
      }
      const filter = (el) => {
        for (const node of query(true, selector, el, true, mode)) {
          if (callback(node, true) === false)
            return removeFilter(parent, filter);
        }
      };
      addFilter(parent, filter);
    },
    selector(desc) {
      switch (true) {
        case isJquery(desc):
          $ = desc;
          return (mode = "jquery");
        case !desc || typeof desc.toLowerCase !== "function":
          return (mode = "css");
        case desc.toLowerCase() === "jquery":
          for (const jq of [window.jQuery, window.$, win.jQuery, win.$]) {
            if (isJquery(jq)) {
              $ = jq;
              break;
            }
          }
          return (mode = $ ? "jquery" : "css");
        case desc.toLowerCase() === "xpath":
          return (mode = "xpath");
        default:
          return (mode = "css");
      }
    },
  };
})();
