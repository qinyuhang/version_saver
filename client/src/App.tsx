import { useState } from 'react';
import { SaveText } from './components/SaveText';
import { VersionList } from './components/VersionList';
import './App.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const handleSaveSuccess = (name?: string) => {
    if (name) setCurrentName(name);
    setRefreshKey((prev) => prev + 1);
    setSaveModalOpen(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>版本管理器</h1>
        <p>保存和管理你的文本版本历史</p>
        <button
          type="button"
          className="app-save-btn"
          onClick={() => setSaveModalOpen(true)}
        >
          保存新版本
        </button>
      </header>
      <main className="app-main">
        <VersionList key={refreshKey} currentName={currentName} />
      </main>

      {saveModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setSaveModalOpen(false)}
          role="presentation"
        >
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <h2 id="modal-title">保存新版本</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSaveModalOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <SaveText onSaveSuccess={handleSaveSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
