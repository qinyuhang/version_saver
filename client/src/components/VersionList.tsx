import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { Version } from '../types/api';
import './VersionList.css';

interface VersionListProps {
  /** 当前选中的名称，用于列出该名称下的版本（可选，为空时不加载） */
  currentName?: string | null;
}

export function VersionList({ currentName }: VersionListProps) {
  const [name, setName] = useState(currentName ?? '');
  const [names, setNames] = useState<string[]>([]);
  const [namesLoading, setNamesLoading] = useState(true);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const loadVersions = async () => {
    const n = name.trim();
    if (!n) {
      setVersions([]);
      setTotal(0);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.listVersions(n, limit, offset);
      setVersions(response.versions);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载版本列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadNames = () => {
    setNamesLoading(true);
    apiClient.listNames().then((list) => {
      const params = new URLSearchParams(window.location.search);
      const nameParam = params.get('name');
      if (nameParam) {
        const decoded = decodeURIComponent(nameParam);
        if (!list.includes(decoded)) list = [...list, decoded];
      }
      setNames(list);
      setNamesLoading(false);
    }).catch(() => setNamesLoading(false));
  };

  const handleRefresh = () => {
    loadNames();
    loadVersions();
  };

  // 加载名称列表（下拉用），并合并 URL 中的 name 以便从链接打开时能选中
  useEffect(() => {
    loadNames();
  }, []);

  useEffect(() => {
    if (currentName != null) setName(currentName);
  }, [currentName]);

  // 支持 URL ?version=id&name=... 打开并选中对应版本
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get('name');
    const versionIdParam = params.get('version');
    if (nameParam) setName(decodeURIComponent(nameParam));
    if (versionIdParam) {
      const id = parseInt(versionIdParam, 10);
      if (!isNaN(id)) {
        apiClient.getVersion(id).then(setSelectedVersion).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    setOffset(0);
  }, [name]);

  useEffect(() => {
    loadVersions();
  }, [name, offset]);

  const handleVersionClick = (version: Version) => {
    setSelectedVersion(version);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="version-list-container">
      <div className="version-list-header">
        <h2>版本历史</h2>
        <div className="version-list-name">
          <label htmlFor="version-list-name-select">按名称查看：</label>
          <select
            id="version-list-name-select"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="version-name-select"
            disabled={namesLoading}
          >
            <option value="">请选择名称</option>
            {names.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="version-list-actions">
          <span className="version-stats">共 {total} 个版本</span>
          <button
            type="button"
            className="version-refresh-btn"
            onClick={handleRefresh}
            disabled={loading || namesLoading}
            title="刷新名称与版本列表"
          >
            刷新
          </button>
        </div>
      </div>

      {loading && <div className="loading">加载中...</div>}
      {error && <div className="error">错误: {error}</div>}
      {!name.trim() && <div className="hint">请从上方下拉菜单选择名称以查看该名称下的版本历史</div>}

      <div className="version-list-layout">
        <div className="version-list-sidebar">
          <div className="version-items">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`version-item ${
                  selectedVersion?.id === version.id ? 'active' : ''
                }`}
                onClick={() => handleVersionClick(version)}
              >
                <div className="version-item-header">
                  <span className="version-id">v{version.version_num}</span>
                  {version.name && <span className="version-name">{version.name}</span>}
                  <span className="version-date">
                    {formatDate(version.created_at)}
                  </span>
                </div>
                <div className="version-preview">
                  {truncateContent(version.content)}
                </div>
                <div className="version-meta">
                  长度: {version.content.length} 字符
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0 || loading}
            >
              上一页
            </button>
            <span>
              第 {Math.floor(offset / limit) + 1} 页 / 共{' '}
              {Math.ceil(total / limit)} 页
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total || loading}
            >
              下一页
            </button>
          </div>
        </div>

        <div className="version-detail">
          {selectedVersion ? (
            <div className="version-detail-content">
              <div className="version-detail-header">
                <h3>版本 v{selectedVersion.version_num}{selectedVersion.name ? ` · ${selectedVersion.name}` : ''}</h3>
                <div className="version-detail-meta">
                  <div>创建时间: {formatDate(selectedVersion.created_at)}</div>
                  <div>更新时间: {formatDate(selectedVersion.updated_at)}</div>
                  <div>内容长度: {selectedVersion.content.length} 字符</div>
                </div>
              </div>
              <div className="version-content">
                <pre>{selectedVersion.content}</pre>
              </div>
            </div>
          ) : (
            <div className="version-detail-placeholder">
              请从左侧选择一个版本来查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
