// No React import needed
import Editor from '@monaco-editor/react';
import { X, Code2 } from 'lucide-react';

const getLanguageFromPath = (path) => {
  if (!path) return 'plaintext';
  if (path.endsWith('.jsx') || path.endsWith('.js')) return 'javascript';
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'typescript';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.md')) return 'markdown';
  return 'plaintext';
};

export default function CodeEditor({ 
  openedFiles, 
  activeFile, 
  fileContents, 
  onCloseFile, 
  onSetActiveFile 
}) {
  
  if (openedFiles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] text-[var(--text-muted)]">
        <Code2 size={48} className="mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">DevSandbox IDE</h3>
        <p className="text-sm">Select a file from the explorer to start editing</p>
      </div>
    );
  }

  const activeContent = activeFile ? fileContents[activeFile] || '' : '';
  const language = getLanguageFromPath(activeFile);

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden h-full w-full">
      {/* Editor Tabs */}
      <div className="flex overflow-x-auto bg-[rgba(255,255,255,0.02)] border-b border-[var(--border)] custom-scrollbar min-h-[40px]">
        {openedFiles.map(file => {
          const isActive = file === activeFile;
          const fileName = file.split('/').pop();
          
          return (
            <div 
              key={file}
              onClick={() => onSetActiveFile(file)}
              className={`flex items-center gap-2 px-4 py-2 border-r border-[var(--border)] cursor-pointer text-sm whitespace-nowrap group transition-colors
                ${isActive 
                  ? 'bg-[#0d1117] text-[var(--text-primary)] border-t-2 border-t-[var(--accent-cyan)]' 
                  : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] border-t-2 border-t-transparent'
                }
              `}
            >
              <span>{fileName}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(file);
                }}
                className={`p-0.5 rounded-md hover:bg-[rgba(255,255,255,0.1)] transition-opacity
                  ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Breadcrumb / Path */}
      {activeFile && (
        <div className="flex items-center px-4 py-1.5 bg-[#0d1117] border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono">
          {activeFile}
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={activeContent}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            readOnly: true, // As per UI/UX, we'll keep it read-only unless we add a save function
          }}
          loading={
            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
              Loading editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
