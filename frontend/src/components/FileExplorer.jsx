import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, FileJson, FileCode2, FileBox, Image as ImageIcon, FileText, File, Folder } from 'lucide-react';

// Helper to build tree from flat paths
function buildTree(paths) {
  const root = { name: 'root', type: 'folder', children: {}, path: '' };
  
  paths.forEach(path => {
    const parts = path.split('/');
    let current = root;
    
    parts.forEach((part, i) => {
      if (!current.children[part]) {
        const isFile = i === parts.length - 1;
        current.children[part] = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: parts.slice(0, i + 1).join('/'),
          children: {}
        };
      }
      current = current.children[part];
    });
  });
  
  return root;
}

const getFileIcon = (filename) => {
  if (filename.endsWith('.jsx') || filename.endsWith('.tsx') || filename.endsWith('.js') || filename.endsWith('.ts')) return <FileCode2 size={14} className="text-blue-400" />;
  if (filename.endsWith('.json')) return <FileJson size={14} className="text-yellow-400" />;
  if (filename.endsWith('.css')) return <FileBox size={14} className="text-pink-400" />;
  if (filename.endsWith('.md')) return <FileText size={14} className="text-gray-300" />;
  if (filename.endsWith('.svg') || filename.endsWith('.png')) return <ImageIcon size={14} className="text-purple-400" />;
  return <File size={14} className="text-gray-400" />;
};

const FileTreeItem = ({ node, level = 0, activeFile, onOpenFile }) => {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto open root and 1 level deep
  const isFile = node.type === 'file';
  const isActive = activeFile === node.path;
  
  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isFile) {
      setIsOpen(!isOpen);
    } else {
      onOpenFile(node.path);
    }
  };

  // Sort: folders first, then files alphabetically
  const sortedChildren = useMemo(() => {
    return Object.values(node.children).sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [node.children]);

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer transition-colors text-sm
          ${isActive ? 'bg-[rgba(124,58,237,0.15)] text-[var(--accent-cyan)] border-r-2 border-[var(--accent-cyan)]' : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)]'}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleToggle}
      >
        {!isFile ? (
          <span className="text-[var(--text-muted)] w-4 flex items-center justify-center">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="w-4 flex items-center justify-center" />
        )}
        
        {isFile ? getFileIcon(node.name) : <Folder size={14} className="text-[var(--text-muted)]" />}
        <span className="truncate whitespace-nowrap">{node.name}</span>
      </div>
      
      {!isFile && isOpen && (
        <div>
          {sortedChildren.map(child => (
            <FileTreeItem 
              key={child.path} 
              node={child} 
              level={level + 1} 
              activeFile={activeFile} 
              onOpenFile={onOpenFile} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileExplorer({ files, activeFile, onOpenFile, isCollapsed }) {
  const tree = useMemo(() => buildTree(files), [files]);
  
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-4 gap-6 w-12 border-r border-[var(--border)] bg-[rgba(255,255,255,0.02)] h-full">
        <Folder size={20} className="text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)] transition-colors" />
      </div>
    );
  }
  
  return (
    <div className="w-[240px] flex-shrink-0 border-r border-[var(--border)] bg-[rgba(255,255,255,0.01)] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Explorer</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {Object.keys(tree.children).length > 0 ? (
          Object.values(tree.children).sort((a,b) => {
             if(a.type !== b.type) return a.type === 'folder' ? -1 : 1;
             return a.name.localeCompare(b.name);
          }).map(node => (
            <FileTreeItem 
              key={node.path} 
              node={node} 
              activeFile={activeFile} 
              onOpenFile={onOpenFile} 
            />
          ))
        ) : (
          <div className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">
            <Folder size={24} className="mx-auto mb-2 opacity-20" />
            <p>Your project is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
