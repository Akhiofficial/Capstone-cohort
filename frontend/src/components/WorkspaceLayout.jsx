import { useState, useRef, useCallback, useEffect } from 'react';
import ChatPanel from './ChatPanel';
import PreviewPanel from './PreviewPanel';
import TerminalPanel from './TerminalPanel';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';
import { useFileSystem } from '../hooks/useFileSystem';
import { Code2, MessageSquare, Terminal, Globe, Search, Layout, Settings } from 'lucide-react';

const MIN_BOTTOM_HEIGHT = 120;
const MAX_BOTTOM_HEIGHT = 600;
const DEFAULT_BOTTOM_HEIGHT = 300;

export default function WorkspaceLayout({ sandboxId, previewUrl, onReset }) {
  // UI State
  const [explorerCollapsed, setExplorerCollapsed] = useState(false);
  const [aiPanelCollapsed] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState('CODE'); // 'CODE' | 'PREVIEW'
  
  // Resize State
  const [bottomHeight, setBottomHeight] = useState(DEFAULT_BOTTOM_HEIGHT);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(DEFAULT_BOTTOM_HEIGHT);

  // File System
  const {
    files,
    fileContents,
    openedFiles,
    activeFile,
    openFile,
    closeFile,
    setActiveFile
  } = useFileSystem(sandboxId);

  const handleResizeStart = useCallback((e) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartHeight.current = bottomHeight;

    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      const delta = dragStartY.current - e.clientY;
      const newHeight = Math.max(MIN_BOTTOM_HEIGHT,
        Math.min(MAX_BOTTOM_HEIGHT, dragStartHeight.current + delta));
      setBottomHeight(newHeight);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [bottomHeight]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setExplorerCollapsed(true);
      } else {
        setExplorerCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0A0D14] text-[var(--text-primary)] font-sans overflow-hidden">
      
      {/* Top Header */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[#0A0D14] flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-bold text-sm text-white tracking-wide">DevSandbox</span>
          </div>
          
          <div className="w-px h-4 bg-[var(--border)] hidden md:block" />
          
          {/* Project ID */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs"
            style={{
              background: 'rgba(6,182,212,0.08)',
              border: '1px solid rgba(6,182,212,0.2)',
              color: 'var(--accent-cyan)',
              fontFamily: 'monospace',
            }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_5px_var(--accent-cyan)]" />
            <span>{sandboxId?.slice(0, 8)}</span>
          </div>
        </div>

        {/* Center Toggle (Code / Preview) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--border)]">
          <button
            onClick={() => setWorkspaceMode('CODE')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              workspaceMode === 'CODE' 
                ? 'bg-[rgba(255,255,255,0.08)] text-white shadow-sm' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.03)]'
            }`}
          >
            <Code2 size={14} /> Code
          </button>
          <button
            onClick={() => setWorkspaceMode('PREVIEW')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              workspaceMode === 'PREVIEW' 
                ? 'bg-[rgba(255,255,255,0.08)] text-white shadow-sm' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.03)]'
            }`}
          >
            <Globe size={14} /> Preview
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 mr-2 text-[var(--text-muted)]">
            <button className="p-1.5 hover:text-white transition-colors"><Search size={16} /></button>
            <button className="p-1.5 hover:text-white transition-colors"><Layout size={16} /></button>
            <button className="p-1.5 hover:text-white transition-colors"><Settings size={16} /></button>
          </div>
          
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-red-400 hover:bg-[rgba(239,68,68,0.14)]"
          >
            Destroy
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: File Explorer */}
        <div className="hidden md:flex">
          <FileExplorer 
            files={files}
            activeFile={activeFile}
            onOpenFile={openFile}
            isCollapsed={explorerCollapsed}
            onToggleCollapse={() => setExplorerCollapsed(!explorerCollapsed)}
          />
        </div>

        {/* Center: Code Editor/Preview + Bottom Dock */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top: Code Editor / Preview */}
          <div className="flex-1 relative flex flex-col">
            {workspaceMode === 'CODE' ? (
              <CodeEditor 
                openedFiles={openedFiles}
                activeFile={activeFile}
                fileContents={fileContents}
                onCloseFile={closeFile}
                onSetActiveFile={setActiveFile}
              />
            ) : (
              <PreviewPanel previewUrl={previewUrl} />
            )}
          </div>

          {/* Resize Handle */}
          <div
            className="h-1.5 w-full bg-[var(--border)] cursor-row-resize flex-shrink-0 transition-colors hover:bg-violet-600 active:bg-violet-500 z-10"
            onMouseDown={handleResizeStart}
          />

          {/* Bottom Dock: Terminal */}
          <div style={{ height: bottomHeight }} className="flex flex-col flex-shrink-0 bg-[#0A0D14]">
            {/* Dock Header */}
            <div className="flex items-center gap-2 px-2 py-1 bg-[rgba(255,255,255,0.02)] border-b border-[var(--border)]">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium text-white bg-[rgba(255,255,255,0.08)]">
                <Terminal size={14} /> Terminal
              </div>
              <div className="flex-1" />
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
                title="Open preview in new tab"
              >
                <Globe size={14} /> Open Preview
              </a>
            </div>

            {/* Dock Content */}
            <div className="flex-1 relative overflow-hidden">
              <TerminalPanel sandboxId={sandboxId} />
            </div>
          </div>
        </div>

        {/* Right Sidebar: AI Chat */}
        <div className="hidden lg:flex flex-none">
          <ChatPanel 
            sandboxId={sandboxId} 
            isCollapsed={aiPanelCollapsed}
            onOpenFile={openFile}
          />
        </div>

      </div>
    </div>
  );
}
