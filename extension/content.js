(function () {
  'use strict';

  const DEBOUNCE_MS = 2000;
  const STORAGE_KEY_API = 'version-saver-api-url';
  const STORAGE_KEY_MEMORY = 'version-saver-memory';
  const MEMORY_MAX_PER_URL = 50;
  const DEFAULT_API = 'http://localhost:8080/api/v1';

  let debounceTimer = null;
  let lastSentText = '';
  let lastHref = window.location.href;
  /** 用于检测「缩短」：上一次观测到的 #chat-history innerText */
  let lastContent = '';

  function getApiBaseUrl() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY_API], (result) => {
        resolve(result[STORAGE_KEY_API] || DEFAULT_API);
      });
    });
  }

  const CHAT_HISTORY_ID = 'chat-history';

  function getPageText() {
    try {
      const el = document.getElementById(CHAT_HISTORY_ID);
      if (!el) return '';
      return el.innerText || '';
    } catch (e) {
      console.warn('[Version Saver] getPageText error:', e);
      return '';
    }
  }

  function addToMemory(name, content) {
    if (typeof content !== 'string' || !name) return;
    chrome.storage.local.get([STORAGE_KEY_MEMORY], (result) => {
      const store = result[STORAGE_KEY_MEMORY] || {};
      const list = store[name] || [];
      list.unshift({ content, timestamp: Date.now() });
      store[name] = list.slice(0, MEMORY_MAX_PER_URL);
      chrome.storage.local.set({ [STORAGE_KEY_MEMORY]: store });
    });
  }

  async function postSave(name, content) {
    const apiBase = await getApiBaseUrl();
    const url = apiBase.replace(/\/$/, '') + '/save';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content }),
    });
    return res;
  }

  /** 内容缩短时：立即把「缩短前」的内容保存为版本，并加入内存 */
  async function saveOnShorten(previousContent, currentContent) {
    const name = window.location.href;
    if (!previousContent.trim()) return;

    try {
      const res = await postSave(name, previousContent);
      addToMemory(name, previousContent);
      lastContent = currentContent;
      lastSentText = previousContent;
      lastHref = name;
      if (res.ok) {
        console.log('[Version Saver] 内容缩短，已保存缩短前版本:', name);
        showToast('内容缩短，已保存上一版本');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('保存失败: ' + (err.error || res.statusText));
      }
    } catch (err) {
      console.warn('[Version Saver] 缩短时保存失败:', err);
      showToast('保存失败: 请检查 API 与网络');
      lastContent = currentContent;
    }
  }

  async function saveVersion() {
    const name = window.location.href;
    const content = getPageText();
    lastContent = content;

    if (!content.trim()) return;
    if (content === lastSentText && name === lastHref) return;

    try {
      const res = await postSave(name, content);
      if (res.ok) {
        lastSentText = content;
        lastHref = name;
        addToMemory(name, content);
        console.log('[Version Saver] 已保存版本:', name);
        showToast('已保存到 Version Saver');
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn('[Version Saver] 保存失败:', res.status, err);
        showToast('保存失败: ' + (err.error || res.statusText));
      }
    } catch (err) {
      console.warn('[Version Saver] 请求失败:', err);
      showToast('保存失败: 请检查 API 地址与网络');
    }
  }

  function scheduleSave() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const current = getPageText();
      if (current.length < lastContent.length) {
        saveOnShorten(lastContent, current);
      } else {
        saveVersion();
      }
    }, DEBOUNCE_MS);
  }

  function onMutation() {
    const current = getPageText();
    if (current.length < lastContent.length && lastContent.length > 0) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = null;
      saveOnShorten(lastContent, current);
    } else {
      scheduleSave();
    }
  }

  function showToast(message) {
    const id = 'version-saver-toast';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      Object.assign(el.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '12px 20px',
        background: '#333',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: '2147483647',
        fontFamily: 'sans-serif',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'opacity 0.3s',
      });
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.opacity = '1';
    clearTimeout(el._hide);
    el._hide = setTimeout(() => {
      el.style.opacity = '0';
    }, 3000);
  }

  function startObserving() {
    const target = document.getElementById(CHAT_HISTORY_ID);
    if (!target) {
      setTimeout(startObserving, 500);
      return;
    }
    lastContent = getPageText();

    const observer = new MutationObserver(onMutation);
    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
      attributes: true,
      attributeFilter: ['value', 'placeholder'],
    });

    const checkHref = () => {
      if (window.location.href !== lastHref) {
        lastHref = window.location.href;
        lastSentText = '';
        lastContent = getPageText();
      }
    };
    window.addEventListener('popstate', checkHref);
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    if (origPush) {
      history.pushState = function () {
        origPush.apply(this, arguments);
        setTimeout(checkHref, 0);
      };
    }
    if (origReplace) {
      history.replaceState = function () {
        origReplace.apply(this, arguments);
        setTimeout(checkHref, 0);
      };
    }

    console.log('[Version Saver] 已开始监听 #chat-history 变化');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving);
  } else {
    startObserving();
  }
})();
