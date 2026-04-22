import {
  describe,
  expect,
  it,
  vi
} from 'vitest';

vi.mock('obsidian-dev-utils/obsidian/plugin/plugin', () => ({
  PluginBase: vi.fn()
}));

vi.mock('obsidian', () => ({
  MarkdownEditView: vi.fn(),
  MarkdownView: vi.fn()
}));

vi.mock('obsidian-dev-utils/object-utils', () => ({
  getPrototypeOf: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/monkey-around', () => ({
  registerPatch: vi.fn()
}));

vi.mock('obsidian-typings/implementations', () => ({
  ViewType: { Markdown: 'markdown' }
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import Plugin from './main.ts';
// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { Plugin as PluginClass } from './plugin.ts';

describe('main', () => {
  it('should export Plugin as default export', () => {
    expect(Plugin).toBe(PluginClass);
  });
});
