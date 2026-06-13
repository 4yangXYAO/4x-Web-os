/**
 * NA.os Word Editor
 * 
 * Simple text editor. Note: Save functionality disabled by system policy.
 */

import { createSignal } from 'solid-js';

export const EditorApp = () => {
  const [content, setContent] = createSignal('');

  return (
    <div class="flex flex-col h-full bg-white text-black font-serif">
      {/* Editor Header */}
      <div class="h-8 bg-gray-100 border-b border-gray-300 flex items-center px-4 gap-4 select-none">
        <div class="text-[10px] font-bold uppercase tracking-widest text-gray-400">File</div>
        <div class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Edit</div>
        <div class="text-[10px] font-bold uppercase tracking-widest text-gray-400">View</div>
        <div class="flex-1" />
        <div class="text-[10px] font-bold uppercase tracking-widest text-red-500">Read Only Mode</div>
      </div>

      {/* Editing Surface */}
      <div class="flex-1 p-12 overflow-auto bg-gray-200 flex justify-center">
        <textarea
          class="w-full max-w-[800px] h-full shadow-2xl p-16 resize-none outline-none border-none bg-white text-lg leading-relaxed"
          placeholder="Start typing..."
          value={content()}
          onInput={(e) => setContent(e.currentTarget.value)}
          spellcheck={false}
        />
      </div>

      {/* Footer */}
      <div class="h-6 bg-gray-100 border-t border-gray-300 flex items-center px-4 justify-between text-[10px] text-gray-500 font-sans uppercase font-bold">
        <div>Characters: {content().length}</div>
        <div>Advanced Typewriter v1.0</div>
      </div>
    </div>
  );
};

export default EditorApp;
