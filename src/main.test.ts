import {
  describe,
  expect,
  it,
  vi
} from 'vitest';

vi.mock('obsidian-dev-utils/obsidian/plugin/plugin', () => ({
  PluginBase: vi.fn()
}));

vi.mock('obsidian-dev-utils/object-utils', () => ({
  castTo: vi.fn(),
  getPrototypeOf: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/components/monkey-around-component', () => ({
  MonkeyAroundComponent: vi.fn()
}));

vi.mock('obsidian', () => ({
  Component: vi.fn(),
  MarkdownEditView: vi.fn(),
  MarkdownView: vi.fn()
}));

vi.mock('@obsidian-typings/obsidian-public-latest/implementations', () => ({
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
