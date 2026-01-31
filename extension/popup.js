(function () {
  'use strict';

  const STORAGE_KEY_API = 'version-saver-api-url';
  const STORAGE_KEY_MEMORY = 'version-saver-memory';
  const STORAGE_KEY_AUTO_SAVE = 'version-saver-auto-save';
  const DEFAULT_API = 'http://localhost:8080/api/v1';
  const THUMB_HEAD = 10;
  const THUMB_TAIL = 10;

  function getApiBaseUrl() {
    return new Promise(function (resolve) {
      chrome.storage.local.get([STORAGE_KEY_API], function (result) {
        resolve(result[STORAGE_KEY_API] || DEFAULT_API);
      });
    });
  }

  function getMemoryForUrl(url) {
    return new Promise(function (resolve) {
      chrome.storage.local.get([STORAGE_KEY_MEMORY], function (result) {
        var store = result[STORAGE_KEY_MEMORY] || {};
        resolve(store[url] || []);
      });
    });
  }

  function removeMemoryAt(url, index) {
    return new Promise(function (resolve) {
      chrome.storage.local.get([STORAGE_KEY_MEMORY], function (result) {
        var store = result[STORAGE_KEY_MEMORY] || {};
        var list = store[url] || [];
        list.splice(index, 1);
        store[url] = list;
        chrome.storage.local.set({ [STORAGE_KEY_MEMORY]: store }, resolve);
      });
    });
  }

  function thumbnail(content) {
    if (typeof content !== 'string') content = '';
    var text = content.trim();
    if (text.length <= THUMB_HEAD + THUMB_TAIL) return text || '（空）';
    return text.slice(0, THUMB_HEAD) + '...' + text.slice(-THUMB_TAIL);
  }

  function formatDate(isoOrTs) {
    try {
      var d = typeof isoOrTs === 'number' ? new Date(isoOrTs) : new Date(isoOrTs);
      return d.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return String(isoOrTs || '');
    }
  }

  function show(el) { el.style.display = ''; }
  function hide(el) { el.style.display = 'none'; }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderMemoryList(url, items) {
    var listEl = document.getElementById('memory-list');
    var emptyEl = document.getElementById('memory-empty');
    hide(document.getElementById('memory-loading'));
    listEl.innerHTML = '';
    if (!items || items.length === 0) {
      emptyEl.textContent = '暂无该页面的内存记录';
      show(emptyEl);
      hide(listEl);
      return;
    }
    hide(emptyEl);
    items.forEach(function (item, index) {
      var li = document.createElement('li');
      li.className = 'memory-item';
      var meta = document.createElement('div');
      meta.className = 'memory-meta';
      meta.innerHTML = '<span>' + formatDate(item.timestamp) + '</span>';
      var btn = document.createElement('button');
      btn.className = 'btn-save';
      btn.textContent = '保存';
      btn.dataset.index = String(index);
      btn.addEventListener('click', function () {
        var i = parseInt(btn.dataset.index, 10);
        saveMemoryItem(url, items[i].content, i);
      });
      meta.appendChild(btn);
      li.appendChild(meta);
      var thumb = document.createElement('div');
      thumb.className = 'memory-thumb';
      thumb.textContent = thumbnail(item.content);
      li.appendChild(thumb);
      listEl.appendChild(li);
    });
    show(listEl);
  }

  function saveMemoryItem(url, content, index) {
    var listEl = document.getElementById('memory-list');
    var btns = listEl.querySelectorAll('.btn-save');
    var btn = btns[index];
    if (btn) btn.disabled = true;
    getApiBaseUrl().then(function (apiBase) {
      var saveUrl = apiBase.replace(/\/$/, '') + '/save';
      return fetch(saveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: url, content: content }),
      });
    }).then(function (res) {
      if (!res.ok) throw new Error(res.statusText || '保存失败');
      return removeMemoryAt(url, index);
    }).then(function () {
      return getMemoryForUrl(url);
    }).then(function (items) {
      renderMemoryList(url, items);
    }).catch(function (err) {
      if (btn) btn.disabled = false;
      alert('保存失败: ' + (err.message || '请检查 API 与网络'));
    });
  }

  function getViewBaseUrl(apiBase) {
    if (!apiBase) return '';
    var base = apiBase.replace(/\/api\/v1\/?$/, '');
    return base || apiBase.replace(/\/$/, '');
  }

  function renderSavedList(versions, apiBase) {
    var listEl = document.getElementById('version-list');
    var loadingEl = document.getElementById('list-loading');
    var emptyEl = document.getElementById('list-empty');
    var errorEl = document.getElementById('list-error');

    hide(loadingEl);
    hide(emptyEl);
    hide(errorEl);
    listEl.innerHTML = '';

    if (!versions || versions.length === 0) {
      emptyEl.textContent = '暂无该页面的历史版本';
      show(emptyEl);
      return;
    }

    var viewBase = getViewBaseUrl(apiBase);

    versions.forEach(function (v) {
      var li = document.createElement('li');
      li.className = 'version-item version-item-clickable';
      li.title = '点击在新标签页中查看';
      li.innerHTML =
        '<div class="version-meta">v' + (v.version_num || v.id) + ' · ' + formatDate(v.created_at) + '</div>' +
        '<div class="version-thumb">' + escapeHtml(thumbnail(v.content)) + '</div>';
      li.addEventListener('click', function () {
        if (!viewBase) {
          getApiBaseUrl().then(function (base) {
            viewBase = getViewBaseUrl(base);
            openViewUrl(viewBase, v);
          });
        } else {
          openViewUrl(viewBase, v);
        }
      });
      listEl.appendChild(li);
    });
    show(listEl);
  }

  function openViewUrl(viewBase, v) {
    var url = viewBase + '?version=' + v.id + '&name=' + encodeURIComponent(v.name || '');
    chrome.tabs.create({ url: url });
  }

  function showError(msg) {
    hide(document.getElementById('list-loading'));
    hide(document.getElementById('list-empty'));
    hide(document.getElementById('version-list'));
    var errorEl = document.getElementById('list-error');
    errorEl.textContent = msg;
    show(errorEl);
  }

  function loadAll(url) {
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      hide(document.getElementById('list-loading'));
      hide(document.getElementById('memory-loading'));
      document.getElementById('list-empty').textContent = '当前页面无法获取 URL';
      show(document.getElementById('list-empty'));
      document.getElementById('memory-empty').textContent = '当前页面无法获取 URL';
      show(document.getElementById('memory-empty'));
      return;
    }

    show(document.getElementById('list-loading'));
    show(document.getElementById('memory-loading'));
    hide(document.getElementById('list-empty'));
    hide(document.getElementById('list-error'));
    hide(document.getElementById('version-list'));
    hide(document.getElementById('memory-empty'));
    hide(document.getElementById('memory-list'));

    getMemoryForUrl(url).then(function (items) {
      hide(document.getElementById('memory-loading'));
      renderMemoryList(url, items);
    });

    loadSavedVersions(url);
  }

  function loadSavedVersions(url) {
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;
    var loadingEl = document.getElementById('list-loading');
    var listEl = document.getElementById('version-list');
    var emptyEl = document.getElementById('list-empty');
    var errorEl = document.getElementById('list-error');
    var btnRefresh = document.getElementById('btn-refresh-saved');

    show(loadingEl);
    hide(emptyEl);
    hide(errorEl);
    hide(listEl);
    if (btnRefresh) btnRefresh.disabled = true;

    var apiBase;
    getApiBaseUrl().then(function (base) {
      apiBase = base;
      var apiUrl = base.replace(/\/$/, '') + '/versions?name=' + encodeURIComponent(url) + '&limit=50&offset=0';
      return fetch(apiUrl);
    }).then(function (res) {
      if (!res.ok) throw new Error(res.statusText || '请求失败');
      return res.json();
    }).then(function (data) {
      hide(loadingEl);
      renderSavedList(data.versions || [], apiBase);
    }).catch(function (err) {
      hide(loadingEl);
      showError('加载失败: ' + (err.message || '请检查 API 地址与网络'));
    }).then(function () {
      if (btnRefresh) btnRefresh.disabled = false;
    });
  }

  var autoSaveEl = document.getElementById('auto-save');
  chrome.storage.local.get([STORAGE_KEY_AUTO_SAVE], function (result) {
    autoSaveEl.checked = result[STORAGE_KEY_AUTO_SAVE] !== false;
  });
  autoSaveEl.addEventListener('change', function () {
    chrome.storage.local.set({ [STORAGE_KEY_AUTO_SAVE]: autoSaveEl.checked });
  });

  document.getElementById('open-options').addEventListener('click', function (e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('btn-refresh-saved').addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var url = (tabs[0] && tabs[0].url) || '';
      loadSavedVersions(url);
    });
  });

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var url = (tabs[0] && tabs[0].url) || '';
    loadAll(url);
  });
})();
