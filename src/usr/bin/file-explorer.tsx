/**
 * NA.os File Explorer
 * 
 * GUI application for browsing and managing the VFS.
 * Supports Create Folder and Delete operations.
 */

import { createSignal, For, onMount, onCleanup } from 'solid-js';
import { Folder, File, ChevronLeft, Home, RotateCcw, FolderPlus, Trash2 } from 'lucide-solid';
import sdk from '../lib/sdk';

export const FileExplorerApp = () => {
  const [currentPath, setCurrentPath] = createSignal('/');
  const [selectedNode, setSelectedNode] = createSignal<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = createSignal(0);

  const entries = () => {
    refreshTrigger(); // Dependency
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

  const createFolder = () => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    
    const path = currentPath() === '/' ? `/${name}` : `${currentPath()}/${name}`;
    const res = sdk.fs.mkdir(path);
    if (res.success) {
      setRefreshTrigger(t => t + 1);
    } else {
      alert(`Error: ${res.error?.message || 'Failed to create folder'}`);
    }
  };

  const deleteSelected = () => {
    const node = entries().find(n => n.id === selectedNode());
    if (!node) return;

    if (!confirm(`Are you sure you want to delete "${node.name}"?`)) return;

    const res = sdk.fs.rm(node.path);
    if (res.success) {
      setSelectedNode(null);
      setRefreshTrigger(t => t + 1);
    } else {
      alert(`Error: ${res.error?.message || 'Failed to delete item'}`);
    }
  };

  // Listen for external FS changes
  onMount(() => {
    const unsub = sdk.events.on('fs:*', () => { setRefreshTrigger(t => t + 1); });
    onCleanup(() => {
        if (typeof unsub === 'function') unsub();
    });
  });

  return (
    <div class="flex flex-col h-full bg-[#0a0a0a] text-white select-none">
      {/* Toolbar */}
      <div class="h-10 border-b border-white/10 flex items-center px-2 gap-2 bg-black/50 overflow-hidden shrink-0">
        <button 
          onClick={goBack} 
          disabled={currentPath() === '/'}
          class="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded transition-colors"
          title="Go Back"
        >
          <ChevronLeft size={16} />
        </button>
        <button 
          onClick={() => navigate('/')} 
          class="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Go Home"
        >
          <Home size={16} />
        </button>
        
        <div class="flex-1 bg-white/5 px-2 py-1 text-[10px] border border-white/10 truncate font-mono text-white/50 lowercase tracking-tight">
          {currentPath()}
        </div>
        
        <div class="w-px h-6 bg-white/10 mx-1" />

        <button 
          onClick={createFolder} 
          class="p-1.5 hover:bg-white/10 text-green-400 rounded transition-colors"
          title="New Folder"
        >
          <FolderPlus size={16} />
        </button>

        <button 
          onClick={deleteSelected}
          disabled={!selectedNode()}
          class={`p-1.5 rounded transition-colors ${selectedNode() ? 'hover:bg-red-500/20 text-red-500' : 'opacity-20'}`}
          title="Delete Item"
        >
          <Trash2 size={16} />
        </button>

        <button 
          onClick={() => { setRefreshTrigger(t => t + 1); }}
          class="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Refresh"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Main Area */}
      <div class="flex-1 p-4 grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 content-start overflow-auto bg-black/20">
        <For each={entries()} fallback={
            <div class="col-span-full h-full flex flex-col items-center justify-center opacity-20">
                <Folder size={48} />
                <span class="text-[10px] mt-2 font-bold uppercase tracking-widest">Directory Empty</span>
            </div>
        }>
          {(node) => (
            <div 
              class={`flex flex-col items-center p-2 gap-1 group cursor-pointer border transition-all rounded ${
                selectedNode() === node.id 
                    ? 'bg-white text-black border-white' 
                    : 'border-transparent hover:bg-white/5 hover:border-white/10'
              }`}
              onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
              onDblClick={() => { if (node.type === 'directory') navigate(node.path); }}
            >
              <div class="w-12 h-12 flex items-center justify-center">
                {node.type === 'directory' ? (
                  <Folder size={28} class={selectedNode() === node.id ? 'text-black fill-black/20' : 'text-blue-400 fill-blue-400/20'} />
                ) : (
                  <File size={28} class={selectedNode() === node.id ? 'text-black' : 'text-gray-400'} />
                )}
              </div>
              <span class={`text-[9px] text-center truncate w-full uppercase font-black tracking-tighter ${selectedNode() === node.id ? 'text-black' : 'text-white'}`}>
                {node.name}
              </span>
            </div>
          )}
        </For>
      </div>

      {/* Status Bar */}
      <div class="h-6 border-t border-white/10 flex items-center justify-between px-4 text-[9px] uppercase font-bold text-white/30 bg-black shrink-0">
        <div>{entries().length} ITEMS TOTAL</div>
        <div class="tracking-widest">SYSTEM VFS v1.0 | NA.OS</div>
      </div>
    </div>
  );
};

export default FileExplorerApp;
