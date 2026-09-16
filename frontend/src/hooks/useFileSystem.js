import { useState, useCallback, useEffect } from 'react';

export function useFileSystem(sandboxId) {
  const [files, setFiles] = useState([]);
  const [fileContents, setFileContents] = useState({}); // { '/src/App.jsx': 'content...' }
  const [openedFiles, setOpenedFiles] = useState([]); // array of file paths
  const [activeFile, setActiveFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the file tree
  const fetchFiles = useCallback(async () => {
    if (!sandboxId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/agent/${sandboxId}/list-files`);
      const data = await response.json();
      if (data.status === 'ok') {
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sandboxId]);

  // Read a specific file's content
  const readFile = useCallback(async (filePath) => {
    if (!sandboxId || !filePath) return;
    
    // Normalize path to start with / for the key if needed, or stick to what the API expects
    // The API expects 'src/App.css' or '/src/App.css' based on context.txt
    try {
      const response = await fetch(`/agent/${sandboxId}/read-files?files=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      if (data.status === 'ok' && data.result?.length > 0) {
        // API returns [{ "/src/App.css": "content..." }]
        const fileObj = data.result[0];
        const key = Object.keys(fileObj)[0];
        const content = fileObj[key];
        
        setFileContents(prev => ({
          ...prev,
          [filePath]: content
        }));
      }
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error);
    }
  }, [sandboxId]);

  // Handle opening a file in the editor
  const openFile = useCallback(async (filePath) => {
    if (!openedFiles.includes(filePath)) {
      setOpenedFiles(prev => [...prev, filePath]);
    }
    setActiveFile(filePath);
    
    // Fetch content if we don't have it yet
    if (!fileContents[filePath]) {
      await readFile(filePath);
    }
  }, [openedFiles, fileContents, readFile]);

  // Close a file tab
  const closeFile = useCallback((filePath) => {
    setOpenedFiles(prev => {
      const next = prev.filter(f => f !== filePath);
      if (activeFile === filePath) {
        // Pick the previous file in the list if any
        setActiveFile(next.length > 0 ? next[next.length - 1] : null);
      }
      return next;
    });
  }, [activeFile]);

  // Initial load
  useEffect(() => {
    if (sandboxId) {
      // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
      fetchFiles();
    }
  }, [sandboxId, fetchFiles]);

  return {
    files,
    fileContents,
    openedFiles,
    activeFile,
    isLoading,
    fetchFiles,
    readFile,
    openFile,
    closeFile,
    setActiveFile
  };
}
