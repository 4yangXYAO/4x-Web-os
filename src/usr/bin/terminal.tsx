/**
 * WEB.OS Terminal
 * 
 * Core system terminal for command-line interaction.
 * Interfaces with the VFS and Process Manager.
 */

import { createSignal, For, createEffect } from 'solid-js';
import sdk from '../lib/sdk';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
}

export const TerminalApp = () => {
  const [history, setHistory] = createSignal<TerminalLine[]>([
    { type: 'info', content: 'WEB.OS SYSTEM TERMINAL v0.1.0' },
    { type: 'info', content: 'Type "help" for a list of available commands.' },
  ]);
  const [currentInput, setCurrentInput] = createSignal('');
  const [cwd] = createSignal('/');
  
  let terminalEnd: HTMLDivElement | undefined;

  const scrollToBottom = () => {
    terminalEnd?.scrollIntoView({ behavior: 'smooth' });
  };

  createEffect(() => {
    history();
    scrollToBottom();
  });

  const handleCommand = async (fullCommand: string) => {
    const args = fullCommand.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();
    
    setHistory(prev => [...prev, { type: 'input', content: `${cwd()}&gt; ${fullCommand}` }]);

    switch (cmd) {
      case 'help':
        addOutput('Available commands: ls, cat, mkdir, rm, echo, date, whoami, clear, ps, help');
        break;
      
      case 'ls': {
        const result = sdk.fs.ls(cwd());
        if (Array.isArray(result)) {
          const names = result.map(node => node.type === 'directory' ? `${node.name}/` : node.name);
          addOutput(names.join('  ') || '(empty)');
        } else {
          addError('Error reading directory');
        }
        break;
      }

      case 'whoami':
        addOutput('user@web-os');
        break;

      case 'clear':
        setHistory([]);
        break;

      case 'date':
        addOutput(new Date().toString());
        break;

      case 'echo':
        addOutput(args.slice(1).join(' '));
        break;

      case 'mkdir': {
        if (!args[1]) {
          addError('Usage: mkdir <directory>');
        } else {
          const res = sdk.fs.mkdir(args[1]);
          if (!res.success) addError(res.error?.message || 'Failed to create directory');
        }
        break;
      }

      case 'ps': {
        const procs = sdk.system.ps();
        addOutput('PID      NAME        STATE       MEM');
        procs.forEach(p => {
          addOutput(`${p.pid.slice(0, 8)} ${p.name.padEnd(10)} ${p.state.padEnd(10)} ${p.memoryUsageMB}MB`);
        });
        break;
      }

      default:
        if (cmd) addError(`Command not found: ${cmd}`);
    }
  };

  const addOutput = (content: string) => setHistory(prev => [...prev, { type: 'output', content }]);
  const addError = (content: string) => setHistory(prev => [...prev, { type: 'error', content }]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      const cmd = currentInput();
      if (cmd.trim()) handleCommand(cmd);
      setCurrentInput('');
    }
  };

  return (
    <div class="flex flex-col h-full bg-black font-mono text-sm p-2 text-green-500 overflow-hidden">
      <div class="flex-1 overflow-y-auto mb-2 custom-scrollbar">
        <For each={history()}>
          {(line) => (
            <div class={`whitespace-pre-wrap mb-1 ${
              line.type === 'input' ? 'text-white' : 
              line.type === 'error' ? 'text-red-500' : 
              line.type === 'info' ? 'text-blue-400' : 'text-green-500'
            }`}>
              {line.content}
            </div>
          )}
        </For>
        <div ref={terminalEnd} />
      </div>
      
      <div class="flex items-center gap-2 shrink-0 border-t border-white/10 pt-2">
        <span class="text-white shrink-0">{cwd()}{'>'}</span>
        <input
          type="text"
          class="bg-transparent border-none outline-none flex-1 text-green-500"
          value={currentInput()}
          onInput={(e) => setCurrentInput(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          autofocus
        />
      </div>
    </div>
  );
};

export default TerminalApp;
