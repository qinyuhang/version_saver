(function () {
  'use strict';

  const STORAGE_KEY_API = 'version-saver-api-url';
  const DEFAULT_API = 'http://localhost:8080/api/v1';

  function getApiBaseUrl() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY_API], (result) => {
        resolve(result[STORAGE_KEY_API] || DEFAULT_API);
      });
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== 'SAVE') {
      sendResponse({ ok: false, error: 'Unknown message type' });
      return true;
    }

    const { name, content } = message;
    if (typeof name !== 'string' || typeof content !== 'string') {
      sendResponse({ ok: false, error: 'Invalid name or content' });
      return true;
    }

    getApiBaseUrl().then((apiBase) => {
      const url = apiBase.replace(/\/$/, '') + '/save';
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
      })
        .then((res) => {
          if (res.ok) {
            sendResponse({ ok: true });
          } else {
            return res.json().catch(() => ({ error: res.statusText })).then((body) => {
              sendResponse({ ok: false, error: body.error || res.statusText });
            });
          }
        })
        .catch((err) => {
          sendResponse({ ok: false, error: err.message || '网络错误' });
        });
    });

    return true; // 保持消息通道开启以异步 sendResponse
  });
})();
