/**
 * WEB.OS File Explorer
 * 
 * GUI application for browsing and managing the VFS.
 */

import { createSignal, For } from 'solid-js';
import { Folder, File, ChevronLeft, Home, RotateCcw } from 'lucide-solid';
import sdk from '../lib/sdk';

export const FileExplorerApp = () => {
  const [currentPath, setCurrentPath] = createSignal('/');
  const [selectedNode, setSelectedNode] = createSignal<string | null>(null);

  const entries = () => {
    const res = sdk.fs.ls(currentPath());
    return Array.isArray(res) ? res : [];
  };

  const navigate = (path: string) => {
    setCurrentPath(path);
    setSelectedNode(null);
  };

  const goBack = () => {
    const parts = currentPath().split('/').filter(Boolean);
    parts.pop();
    navigate('/' + parts.join('/'));
  };

  return (
    <div class="flex flex-col h-full bg-[#0a0a0a] text-white">
      {/* Toolbar */}
      <div class="h-10 border-b border-white/10 flex items-center px-2 gap-2 bg-black/50 overflow-hidden">
        <button 
          onClick={goBack} 
          disabled={currentPath() === '/'}
          class="p-1 hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <button 
          onClick={() => navigate('/')} 
          class="p-1 hover:bg-white/10"
        >
          <Home size={16} />
        </button>
        
        <div class="flex-1 bg-white/5 px-2 py-1 text-xs border border-white/10 truncate font-mono">
          {currentPath()}
        </div>
        
        <button class="p-1 hover:bg-white/10">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Main Area */}
      <div class="flex-1 p-4 grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 content-start overflow-auto">
        <For each={entries()}>
          {(node) => (
            <div 
              class={`flex flex-col items-center p-2 gap-1 group cursor-pointer border border-transparent hover:bg-white/5 ${
                selectedNode() === node.id ? 'bg-white/10 border-white/20' : ''
              }`}
              onClick={() => setSelectedNode(node.id)}
              onDblClick={() => node.type === 'directory' ? navigate(node.path) : null}
            >
              <div class="w-10 h-10 flex items-center justify-center">
                {node.type === 'directory' ? (
                  <Folder size={24} class="text-blue-400 fill-blue-400/20" />
                ) : (
                  <File size={24} class="text-gray-400" />
                )}
              </div>
              <span class="text-[10px] text-center truncate w-full uppercase font-bold tracking-tighter">
                {node.name}
              </span>
            </div>
          )}
        </For>
      </div>

      {/* Status Bar */}
      <div class="h-6 border-t border-white/10 flex items-center px-4 text-[10px] uppercase font-bold text-white/40">
        {entries().length} ITEMS | SYSTEM VFS MOUNTED
      </div>
    </div>
  );
};

export default FileExplorerApp;
