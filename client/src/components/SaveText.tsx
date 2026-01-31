import { useState } from 'react';
import { apiClient } from '../api/client';
import './SaveText.css';

interface SaveTextProps {
  onSaveSuccess?: (name?: string) => void;
}

export function SaveText({ onSaveSuccess }: SaveTextProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('名称不能为空');
      return;
    }
    if (!content.trim()) {
      setError('内容不能为空');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      await apiClient.saveText(content, name.trim());
      setSuccess(true);
      setContent('');
      
      // 通知父组件刷新版本列表
      if (onSaveSuccess) {
        onSaveSuccess(name.trim());
      }

      // 3秒后清除成功消息
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="save-text-container">
      <h2>保存新版本</h2>
      <form onSubmit={handleSubmit} className="save-text-form">
        <div className="form-group">
          <label htmlFor="name">文本名称</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：我的文档、笔记标题..."
            className="content-textarea"
            style={{ minHeight: 'auto', height: '40px' }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">文本内容</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在此输入要保存的文本内容..."
            rows={10}
            className="content-textarea"
          />
          <div className="char-count">
            {content.length} 字符
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">保存成功！</div>}

        <button
          type="submit"
          disabled={loading || !name.trim() || !content.trim()}
          className="save-button"
        >
          {loading ? '保存中...' : '保存版本'}
        </button>
      </form>
    </div>
  );
}
