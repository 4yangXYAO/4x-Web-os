/**
 * NA.os Word Editor
 * 
 * Full-featured text editor with VFS integration.
 * Supports loading and saving files to the system.
 */

import { createSignal } from 'solid-js';
import { Save, FileText, Share2, Printer } from 'lucide-solid';
import sdk from '../lib/sdk';

export const EditorApp = () => {
  const [content, setContent] = createSignal('');
  const [currentFile, setCurrentFile] = createSignal<string | null>(null);
  const [isModified, setIsModified] = createSignal(false);

  const handleSave = () => {
    let path = currentFile();
    if (!path) {
      const name = prompt('Enter filename (e.g. document.txt):');
      if (!name) return;
      path = name.startsWith('/') ? name : `/home/${name}`;
    }

    const res = sdk.fs.write(path, content());
    if (res.success) {
      setCurrentFile(path);
      setIsModified(false);
      sdk.ui.notify('Success', `File saved to ${path}`);
    } else {
      sdk.ui.alert(`Failed to save: ${res.error?.message}`);
    }
  };

  const handleNew = () => {
    if (isModified() && !confirm('Discard unsaved changes?')) return;
    setContent('');
    setCurrentFile(null);
    setIsModified(false);
  };

  return (
    <div class="flex flex-col h-full bg-[#f8f9fa] text-black font-sans overflow-hidden">
      {/* Ribbon / Toolbar */}
      <div class="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2 select-none shadow-sm z-10">
        <div class="flex items-center gap-1 mr-4">
             <div class="w-8 h-8 bg-[#2b579a] flex items-center justify-center rounded">
                <FileText size={18} class="text-white" />
             </div>
             <span class="text-xs font-bold ml-1 hidden md:block">Word Processor</span>
        </div>

        <button 
            onClick={handleNew}
            class="flex flex-col items-center justify-center px-3 py-1 hover:bg-gray-100 rounded text-[10px] font-bold uppercase transition-colors"
        >
            <div class="mb-0.5 opacity-60">New</div>
        </button>

        <button 
            onClick={handleSave}
            class={`flex flex-col items-center justify-center px-3 py-1 hover:bg-gray-100 rounded text-[10px] font-bold uppercase transition-colors ${isModified() ? 'text-[#2b579a]' : 'opacity-60'}`}
        >
            <Save size={14} class="mb-0.5" />
            <span>{isModified() ? 'Save*' : 'Save'}</span>
        </button>

        <div class="w-px h-6 bg-gray-200 mx-2" />

        <div class="hidden sm:flex gap-1">
            <button class="p-2 hover:bg-gray-100 rounded opacity-40"><Printer size={14}/></button>
            <button class="p-2 hover:bg-gray-100 rounded opacity-40"><Share2 size={14}/></button>
        </div>

        <div class="flex-1" />

        <div class="text-[9px] font-black uppercase text-gray-300 tracking-widest hidden lg:block">NA.OS PRODUCTIVITY SUITE</div>
      </div>

      {/* Editing Surface */}
      <div class="flex-1 p-4 md:p-8 overflow-auto bg-gray-100/50 flex justify-center custom-scrollbar">
        <div class="w-full max-w-[800px] min-h-[1000px] bg-white shadow-[0_0_20px_rgba(0,0,0,0.05)] p-12 md:p-20 relative">
            <textarea
              class="w-full h-full resize-none outline-none border-none bg-transparent text-lg md:text-xl leading-relaxed font-serif text-gray-800"
              placeholder="Start your document here..."
              value={content()}
              onInput={(e) => {
                setContent(e.currentTarget.value);
                setIsModified(true);
              }}
              spellcheck={false}
            />
        </div>
      </div>

      {/* Status Bar */}
      <div class="h-6 bg-[#2b579a] text-white flex items-center px-4 justify-between text-[10px] font-bold uppercase tracking-tight shrink-0">
        <div class="flex gap-4">
            <span>{currentFile() || 'Untitled Document'}</span>
            <span class="opacity-60">Chars: {content().length}</span>
        </div>
        <div class="opacity-80">Connected to System VFS</div>
      </div>
    </div>
  );
};

export default EditorApp;
