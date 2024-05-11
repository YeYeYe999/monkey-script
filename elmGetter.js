// ==UserScript==
// @name         ElementGetter
// @author       cxxjackie, chatGPT
// @version      2.2.2
// ==/UserScript==

const elmGetter = (() => {
  const windowObject = window.unsafeWindow || document.defaultView || window;
  const documentObject = windowObject.document;
  let mode = "css";
  let $;

  const matches =
    Element.prototype.matches ||
    Element.prototype.matchesSelector ||
    Element.prototype.webkitMatchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.oMatchesSelector;

  const MutationObserver =
    windowObject.MutationObserver ||
    windowObject.WebkitMutationObserver ||
    windowObject.MozMutationObserver;

  const listeners = new WeakMap();

  function addObserver(target, callback) {
    const observer = new MutationObserver((mutations) => {
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

  function queryAll(selector, parent, includeParent) {
    const checkParent = includeParent && matches.call(parent, selector);
    return Array.from(parent.querySelectorAll(selector), (el) =>
      checkParent ? [parent].concat(el) : el
    );
  }

  function queryOne(selector, parent, timeout) {
    return new Promise((resolve) => {
      const node = query(selector, parent);

      if (node) return resolve(node);

      const filter = (el) => {
        const found = query(selector, el);

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

  function query(selector, parent) {
    switch (mode) {
      case "css":
        return parent.querySelector(selector);

      case "jquery":
        let jNodes = $(parent);
        jNodes = jNodes.add([...parent.querySelectorAll("*")]);

        return jNodes.filter(selector).first();

      case "xpath":
        const ownerDoc = parent.ownerDocument || parent;
        const xPathResult = ownerDoc.evaluate(
          selector + "/self::*",
          parent,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );

        return xPathResult.singleNodeValue;

      default:
        return null;
    }
  }

  return {
    get currentSelector() {
      return mode;
    },

    get(selector, parent = documentObject, timeout = 0) {
      if (Array.isArray(selector)) {
        return Promise.all(selector.map((s) => queryOne(s, parent, timeout)));
      }

      return queryOne(selector, parent, timeout);
    },

    each(selector, parent = documentObject, callback) {
      const nodes = queryAll(selector, parent, false);

      for (const node of nodes) {
        if (callback(node) === false) break;
      }

      const filter = (el) => {
        for (const node of queryAll(selector, el, true)) {
          if (callback(node, true) === false) {
            return removeFilter(parent, filter);
          }
        }
      };

      addFilter(parent, filter);
    },

    eachAsync(selector, parent = documentObject, callback) {
      return new Promise((resolve, reject) => {
        const nodes = queryAll(selector, parent, false);
        const promises = [];

        for (const node of nodes) {
          const result = callback(node);
          if (result instanceof Promise) {
            promises.push(result);
          }
        }

        const filter = (el) => {
          for (const node of queryAll(selector, el, true)) {
            const result = callback(node, true);
            if (result instanceof Promise) {
              promises.push(result);
            }
          }
        };

        addFilter(parent, filter);

        Promise.all(promises)
          .then(() => {
            removeFilter(parent, filter);
            resolve();
          })
          .catch(reject);
      });
    },

    selector(desc) {
      switch (true) {
        case isJquery(desc):
          $ = desc;
          return (mode = "jquery");

        case !desc || typeof desc.toLowerCase !== "function":
          return (mode = "css");

        case desc.toLowerCase() === "jquery":
          for (const jq of [
            window.jQuery,
            window.$,
            windowObject.jQuery,
            windowObject.$,
          ]) {
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
