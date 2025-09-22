// ==UserScript==
// @name         Element Getter Lite
// @namespace    https://bbs.tampermonkey.net.cn/
// @version      1.0.0
// @description  简洁优雅的元素获取工具，支持等待元素出现
// @author       You
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  class ElementGetter {
    constructor(timeout = 0) {
      this.defaultTimeout = timeout;
      this.observers = new WeakMap();
    }

    /**
     * 获取单个元素（可等待）
     * @param {string} selector - CSS选择器
     * @param {Element|Document} root - 查询的根节点
     * @param {number} timeout - 超时时间(ms)
     * @returns {Promise<Element|null>}
     */
    getOne(selector, root = document, timeout = this.defaultTimeout) {
      const found = root.querySelector(selector);
      if (found) return Promise.resolve(found);

      return new Promise((resolve) => {
        let timer;
        const observer = new MutationObserver(() => {
          const node = root.querySelector(selector);
          if (node) {
            observer.disconnect();
            clearTimeout(timer);
            resolve(node);
          }
        });

        observer.observe(root, { childList: true, subtree: true });

        if (timeout > 0) {
          timer = setTimeout(() => {
            observer.disconnect();
            resolve(null);
          }, timeout);
        }
      });
    }

    /**
     * 获取多个元素（不会等待）
     * @param {string} selector - CSS选择器
     * @param {Element|Document} root - 查询的根节点
     * @returns {Element[]}
     */
    getAll(selector, root = document) {
      return Array.from(root.querySelectorAll(selector));
    }
  }

  // 提供一个全局实例，方便直接使用
  window.$getter = new ElementGetter(3000); // 默认超时3秒
})();
