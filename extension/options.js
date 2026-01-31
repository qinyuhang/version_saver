(function () {
  'use strict';

  const STORAGE_KEY_API = 'version-saver-api-url';
  const DEFAULT_API = 'http://localhost:8080/api/v1';

  const input = document.getElementById('api-url');
  const btn = document.getElementById('save');

  chrome.storage.local.get([STORAGE_KEY_API], function (result) {
    input.value = result[STORAGE_KEY_API] || DEFAULT_API;
  });

  btn.addEventListener('click', function () {
    const url = (input.value || '').trim().replace(/\/+$/, '');
    if (!url) {
      input.value = DEFAULT_API;
      chrome.storage.local.set({ [STORAGE_KEY_API]: DEFAULT_API });
    } else {
      chrome.storage.local.set({ [STORAGE_KEY_API]: url });
    }
    btn.textContent = '已保存';
    setTimeout(function () { btn.textContent = '保存'; }, 1500);
  });
})();
