import type { Extension } from '@codemirror/state';
import type {
  App as AppOriginal,
  MarkdownEditView,
  PluginManifest,
  WorkspaceLeaf
} from 'obsidian';

import { castTo } from 'obsidian-dev-utils/object-utils';
import {
  App,
  MarkdownView
} from 'obsidian-test-mocks/obsidian';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

interface EditModeContext {
  editMode: MarkdownEditView;
  nextExtensions: ExtensionsHolder;
  updateOptions: ReturnType<typeof vi.fn>;
}

interface EditModeHolder {
  editMode: MarkdownEditView;
}

interface ExtensionsHolder {
  value: Extension[];
}

interface ExtensionWithValue {
  value: string;
}

interface GetConfigHolder {
  getConfig: ReturnType<typeof vi.fn>;
}

interface PatchedPlugin {
  editMode: MarkdownEditView;
  getConfig: ReturnType<typeof vi.fn>;
  nextExtensions: ExtensionsHolder;
  plugin: Plugin;
  updateOptions: ReturnType<typeof vi.fn>;
}

const HARDCODED_TAB_SIZE = 4;
const DIFFERENT_TAB_SIZE = 2;

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

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede this import.
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

  it('should patch markdown views on layout change', async () => {
    const { updateOptions } = await loadPatchedPlugin();

    expect(updateOptions).toHaveBeenCalledTimes(1);
  });

  it('should update every open markdown view after patching', async () => {
    const first = createEditMode();
    const second = createEditMode();
    setLeaves([createMarkdownLeaf(first.editMode), createMarkdownLeaf(second.editMode)]);

    await loadPlugin();
    appMock.workspace.trigger('layout-change');

    expect(first.updateOptions).toHaveBeenCalledTimes(1);
    expect(second.updateOptions).toHaveBeenCalledTimes(1);
  });

  it('should not re-patch on a second layout change', async () => {
    const { updateOptions } = await loadPatchedPlugin();
    const getLeavesOfType = vi.mocked(appMock.workspace.getLeavesOfType);
    getLeavesOfType.mockClear();
    updateOptions.mockClear();

    appMock.workspace.trigger('layout-change');

    expect(getLeavesOfType).not.toHaveBeenCalled();
    expect(updateOptions).not.toHaveBeenCalled();
  });

  it('should not patch when no markdown views exist', async () => {
    const { updateOptions } = createEditMode();
    setLeaves([]);

    await loadPlugin();
    appMock.workspace.trigger('layout-change');

    expect(updateOptions).not.toHaveBeenCalled();
  });

  it('should not patch when leaves are not markdown views', async () => {
    const { updateOptions } = createEditMode();
    const nonMarkdownLeaf = castTo<WorkspaceLeaf>({ view: { editMode: { updateOptions } } });
    setLeaves([nonMarkdownLeaf]);

    await loadPlugin();
    appMock.workspace.trigger('layout-change');

    expect(updateOptions).not.toHaveBeenCalled();
  });

  describe('getDynamicExtensions', () => {
    it('should pass extensions through unchanged when useTab is true', async () => {
      const { editMode, getConfig, nextExtensions } = await loadPatchedPlugin();
      getConfig.mockImplementation((key: string) => key === 'useTab');
      nextExtensions.value = makeExtensions('    ');

      const result = editMode.getDynamicExtensions();

      expect(result).toBe(nextExtensions.value);
    });

    it('should not modify extensions when tabSize equals the hardcoded value', async () => {
      const { editMode, getConfig, nextExtensions } = await loadPatchedPlugin();
      getConfig.mockImplementation((key: string) => key === 'tabSize' ? HARDCODED_TAB_SIZE : false);
      nextExtensions.value = makeExtensions('    ');

      const result = editMode.getDynamicExtensions();

      expect(extensionValue(result[0])).toBe('    ');
    });

    it('should rewrite the tab-size extension when useTab is false and tabSize differs', async () => {
      const { editMode, getConfig, nextExtensions } = await loadPatchedPlugin();
      getConfig.mockImplementation((key: string) => key === 'tabSize' ? DIFFERENT_TAB_SIZE : false);
      nextExtensions.value = makeExtensions('    ');

      const result = editMode.getDynamicExtensions();

      expect(extensionValue(result[0])).toBe('  ');
    });

    it('should not modify extensions when no matching tab-size extension is found', async () => {
      const { editMode, getConfig, nextExtensions } = await loadPatchedPlugin();
      getConfig.mockImplementation((key: string) => key === 'tabSize' ? DIFFERENT_TAB_SIZE : false);
      nextExtensions.value = makeExtensions('something-else');

      const result = editMode.getDynamicExtensions();

      expect(extensionValue(result[0])).toBe('something-else');
    });

    it('should ignore extensions without a value property', async () => {
      const { editMode, getConfig, nextExtensions } = await loadPatchedPlugin();
      getConfig.mockImplementation((key: string) => key === 'tabSize' ? DIFFERENT_TAB_SIZE : false);
      nextExtensions.value = castTo<Extension[]>([{}]);

      const result = editMode.getDynamicExtensions();

      expect(result).toBe(nextExtensions.value);
    });
  });

  function createEditMode(): EditModeContext {
    const nextExtensions: ExtensionsHolder = { value: [] };

    class EditModeGrandparent {
      public getDynamicExtensions(): Extension[] {
        return nextExtensions.value;
      }
    }
    class EditModeParent extends EditModeGrandparent {}
    const updateOptions = vi.fn();
    class EditModeChild extends EditModeParent {
      public updateOptions = updateOptions;
    }

    return {
      editMode: castTo<MarkdownEditView>(new EditModeChild()),
      nextExtensions,
      updateOptions
    };
  }

  function createMarkdownLeaf(editMode: MarkdownEditView): WorkspaceLeaf {
    const view = castTo<MarkdownView>(Object.create(MarkdownView.prototype));
    castTo<EditModeHolder>(view).editMode = editMode;
    return castTo<WorkspaceLeaf>({ view });
  }

  function setLeaves(leaves: WorkspaceLeaf[]): void {
    appMock.workspace.getLeavesOfType = castTo<typeof appMock.workspace.getLeavesOfType>(vi.fn(() => leaves));
  }

  function stubGetConfig(): ReturnType<typeof vi.fn> {
    const getConfig = vi.fn();
    castTo<GetConfigHolder>(appMock.vault).getConfig = getConfig;
    return getConfig;
  }

  async function loadPlugin(): Promise<Plugin> {
    const plugin = new Plugin(app, manifest);
    await plugin.onload();
    loadedPlugins.push(plugin);
    return plugin;
  }

  async function loadPatchedPlugin(): Promise<PatchedPlugin> {
    const { editMode, nextExtensions, updateOptions } = createEditMode();
    const getConfig = stubGetConfig();
    setLeaves([createMarkdownLeaf(editMode)]);
    const plugin = await loadPlugin();
    appMock.workspace.trigger('layout-change');
    return { editMode, getConfig, nextExtensions, plugin, updateOptions };
  }
});

function extensionValue(extension: Extension | undefined): string | undefined {
  return castTo<ExtensionWithValue | undefined>(extension)?.value;
}

function makeExtensions(value: string): Extension[] {
  return castTo<Extension[]>([{ value }]);
}
