/**
 * NA.os Application Registry
 * 
 * Maps appId to implementation components.
 * Central place for application definitions.
 */

import { lazy } from 'solid-js';

export const APP_REGISTRY: Record<string, { title: string; component: any; icon?: string }> = {
  terminal: {
    title: 'System Terminal',
    component: lazy(() => import('../../usr/bin/terminal')),
  },
  files: {
    title: 'File Explorer',
    component: lazy(() => import('../../usr/bin/file-explorer')),
  },
  editor: {
    title: 'Word Editor',
    component: lazy(() => import('../../usr/apps/editor')),
  },
  draw: {
    title: 'Drawing Tool',
    component: lazy(() => import('../../usr/apps/draw')),
  },
  games: {
    title: 'Neo Arcade',
    component: lazy(() => import('../../usr/apps/games')),
  },
  settings: {
    title: 'System Settings',
    component: lazy(() => import('../../usr/bin/settings')),
  }
};

export type AppId = keyof typeof APP_REGISTRY;
