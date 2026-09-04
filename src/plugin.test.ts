import type {
  App as AppOriginal,
  PluginManifest
} from 'obsidian';

import { castTo } from 'obsidian-dev-utils/object-utils';
import {
  App,
  Component
} from 'obsidian-test-mocks/obsidian';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

const manifest: PluginManifest = {
  author: 'Test Author',
  description: 'Fixes the tab size.',
  id: 'fix-tab-size',
  minAppVersion: '1.0.0',
  name: 'Fix Tab Size',
  version: '1.2.9'
};

// Stub the one dev-utils utility that the real PluginBase.onload() reads off the app.
// The strict mock App lacks the shared-state bag, so return a value-wrapper double.
vi.mock('obsidian-dev-utils/obsidian/app', async (importOriginal) => {
  const actual = await importOriginal<typeof import('obsidian-dev-utils/obsidian/app')>();
  return {
    ...actual,
    getObsidianDevUtilsState: vi.fn((_app: AppOriginal | null, _key: string, defaultValue: unknown) => ({ value: defaultValue }))
  };
});

// Replace the child component with a real (empty) Component so addChild's load contract holds.
// Recording the constructor call lets the delegation to FixTabSizeComponent be asserted.
vi.mock('./fix-tab-size-component.ts', async () => {
  const { Component: ComponentMock } = await vi.importActual<typeof import('obsidian-test-mocks/obsidian')>('obsidian-test-mocks/obsidian');
  return {
    // eslint-disable-next-line prefer-arrow-callback -- the mock must be `new`-able, and arrow functions cannot be constructed.
    FixTabSizeComponent: vi.fn(function FixTabSizeComponentStub() {
      return new ComponentMock();
    })
  };
});

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede these imports.
import { FixTabSizeComponent } from './fix-tab-size-component.ts';
// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede these imports.
import { Plugin } from './plugin.ts';

describe('Plugin', () => {
  let appMock: App;
  let app: AppOriginal;
  const loadedPlugins: Plugin[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    appMock = App.createConfigured__();
    appMock.workspace.onLayoutReady = vi.fn((callback: () => void) => {
      callback();
    });
    app = appMock.asOriginalType__();
  });

  afterEach(() => {
    while (loadedPlugins.length > 0) {
      loadedPlugins.pop()?.unload();
    }
    vi.restoreAllMocks();
  });

  it('should add a FixTabSizeComponent constructed with the app as a child', async () => {
    const plugin = new Plugin(app, manifest);
    const addChildSpy = vi.spyOn(plugin, 'addChild');

    await plugin.onload();
    loadedPlugins.push(plugin);

    const constructedComponent = castTo<Component>(vi.mocked(FixTabSizeComponent).mock.results[0]?.value);
    expect(FixTabSizeComponent).toHaveBeenCalledWith({ app });
    expect(addChildSpy).toHaveBeenCalledWith(constructedComponent);
  });

  it('should register the open demo vault command', async () => {
    const plugin = new Plugin(app, manifest);
    const addCommandSpy = vi.spyOn(plugin, 'addCommand');

    await plugin.onload();
    loadedPlugins.push(plugin);

    expect(addCommandSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'open-demo-vault' }));
  });
});
