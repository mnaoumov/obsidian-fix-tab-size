import type { Extension } from '@codemirror/state';
import type { Component } from 'obsidian';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

interface ExtensionWithValue {
  value: string;
}

interface MockApp {
  vault: MockVault;
  workspace: MockWorkspace;
}

interface MockEditMode {
  updateOptions: ReturnType<typeof vi.fn>;
}

interface MockLeaf {
  view: MockMarkdownView;
}

interface MockMarkdownView {
  editMode: MockEditMode;
}

interface MockVault {
  getConfig: ReturnType<typeof vi.fn>;
}

interface MockWorkspace {
  getLeavesOfType: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
}

interface PluginPrivateMethods {
  getDynamicExtensions: (next: () => Extension[], markdownEditView: unknown) => Extension[];
  isPatched: boolean;
  patchDynamicExtensions: () => void;
}

const PluginBaseMock = vi.hoisted(() =>
  class {
    public app: unknown;
    public consoleDebugComponent = { debug: vi.fn() };
    public manifest: unknown;
    private readonly eventHandlers: unknown[] = [];
    private readonly addedChildren: Component[] = [];

    public constructor(app: unknown, manifest: unknown) {
      this.app = app;
      this.manifest = manifest;
    }

    public async onloadImpl(): Promise<void> {
      // Base implementation does nothing in mock.
    }

    public addChild<T extends Component>(child: T): T {
      this.addedChildren.push(child);
      return child;
    }

    public registerEvent(ref: unknown): void {
      this.eventHandlers.push(ref);
    }
  }
);

vi.mock('obsidian-dev-utils/obsidian/plugin/plugin', () => ({
  PluginBase: PluginBaseMock
}));

vi.mock('obsidian-dev-utils/object-utils', () => ({
  getPrototypeOf: vi.fn((obj: unknown) => Object.getPrototypeOf(obj as object))
}));

vi.mock('obsidian-dev-utils/obsidian/monkey-around', () => ({
  registerPatch: vi.fn()
}));

vi.mock('@obsidian-typings/obsidian-public-latest/implementations', () => ({
  ViewType: {
    Markdown: 'markdown'
  }
}));

const MockMarkdownViewClass = vi.hoisted(() => {
  class EditModeGrandparent {
    public getDynamicExtensions(): unknown[] {
      return [];
    }
  }
  class EditModeParent extends EditModeGrandparent {}
  class EditModeChild extends EditModeParent {
    public updateOptions = vi.fn();
  }

  return class {
    public editMode = new EditModeChild();
  };
});

vi.mock('obsidian', () => ({
  MarkdownEditView: vi.fn(),
  MarkdownView: MockMarkdownViewClass
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { MarkdownView } from 'obsidian';
// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { registerPatch } from 'obsidian-dev-utils/obsidian/monkey-around';

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { Plugin } from './plugin.ts';

function asPrivate(p: Plugin): PluginPrivateMethods {
  // eslint-disable-next-line no-restricted-syntax -- Accessing private methods for testing needs double assertion.
  return p as unknown as PluginPrivateMethods;
}

function createMockApp(): MockApp {
  return {
    vault: {
      getConfig: vi.fn()
    },
    workspace: {
      getLeavesOfType: vi.fn().mockReturnValue([]),
      on: vi.fn().mockReturnValue({ id: 'event-ref' })
    }
  };
}

function createMockMarkdownView(): MockMarkdownView {
  // eslint-disable-next-line no-restricted-syntax -- Mocked MarkdownView constructor takes no args, real signature expects a leaf.
  const MockedMarkdownView = MarkdownView as unknown as new () => MarkdownView;
  const view = new MockedMarkdownView();
  // eslint-disable-next-line no-restricted-syntax -- Mocked class needs double assertion to match interface.
  return view as unknown as MockMarkdownView;
}

describe('Plugin', () => {
  let plugin: Plugin;
  let mockApp: MockApp;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApp = createMockApp();
    plugin = new Plugin(mockApp as never, { id: 'fix-tab-size' } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should extend PluginBase', () => {
    expect(plugin).toBeInstanceOf(PluginBaseMock);
  });

  describe('onloadImpl', () => {
    it('should call patchDynamicExtensions and register layout-change event', async () => {
      const privateMethods = asPrivate(plugin);
      const patchSpy = vi.spyOn(privateMethods, 'patchDynamicExtensions');

      // eslint-disable-next-line no-restricted-syntax -- Calling protected method for testing needs double assertion.
      await (plugin as unknown as { onloadImpl: () => Promise<void> }).onloadImpl();

      expect(patchSpy).toHaveBeenCalled();
      expect(mockApp.workspace.on).toHaveBeenCalledWith('layout-change', expect.any(Function));
    });
  });

  describe('patchDynamicExtensions', () => {
    it('should return early if already patched', () => {
      asPrivate(plugin).isPatched = true;

      asPrivate(plugin).patchDynamicExtensions();

      expect(mockApp.workspace.getLeavesOfType).not.toHaveBeenCalled();
    });

    it('should return early if no markdown views exist', () => {
      mockApp.workspace.getLeavesOfType.mockReturnValue([]);

      asPrivate(plugin).patchDynamicExtensions();

      expect(registerPatch).not.toHaveBeenCalled();
      expect(asPrivate(plugin).isPatched).toBe(false);
    });

    it('should return early if views are not MarkdownView instances', () => {
      const nonMarkdownLeaf = { view: { editMode: { updateOptions: vi.fn() } } };
      mockApp.workspace.getLeavesOfType.mockReturnValue([nonMarkdownLeaf]);

      asPrivate(plugin).patchDynamicExtensions();

      expect(registerPatch).not.toHaveBeenCalled();
      expect(asPrivate(plugin).isPatched).toBe(false);
    });

    it('should patch and update markdown views when available', () => {
      const mockView = createMockMarkdownView();
      const mockLeaf: MockLeaf = { view: mockView };
      mockApp.workspace.getLeavesOfType.mockReturnValue([mockLeaf]);

      asPrivate(plugin).patchDynamicExtensions();

      expect(asPrivate(plugin).isPatched).toBe(true);
      expect(registerPatch).toHaveBeenCalled();
      expect(mockView.editMode.updateOptions).toHaveBeenCalled();
    });

    it('should update all markdown views after patching', () => {
      const mockView1 = createMockMarkdownView();
      const mockView2 = createMockMarkdownView();
      const mockLeaf1: MockLeaf = { view: mockView1 };
      const mockLeaf2: MockLeaf = { view: mockView2 };
      mockApp.workspace.getLeavesOfType.mockReturnValue([mockLeaf1, mockLeaf2]);

      asPrivate(plugin).patchDynamicExtensions();

      expect(mockView1.editMode.updateOptions).toHaveBeenCalled();
      expect(mockView2.editMode.updateOptions).toHaveBeenCalled();
    });
  });

  describe('getDynamicExtensions', () => {
    it('should pass through extensions when useTab is true', () => {
      mockApp.vault.getConfig.mockImplementation((key: string) => {
        if (key === 'useTab') {
          return true;
        }
        return undefined;
      });

      // eslint-disable-next-line no-restricted-syntax -- Mock extension objects need double assertion to match Extension type.
      const extensions = [{ value: 'test' }] as unknown as Extension[];
      const next = vi.fn().mockReturnValue(extensions);

      const result = asPrivate(plugin).getDynamicExtensions(next, {});

      expect(result).toBe(extensions);
    });

    it('should not modify extensions when tabSize equals hardcoded value of 4', () => {
      const HARDCODED_TAB_SIZE = 4;
      mockApp.vault.getConfig.mockImplementation((key: string) => {
        if (key === 'useTab') {
          return false;
        }
        if (key === 'tabSize') {
          return HARDCODED_TAB_SIZE;
        }
        return undefined;
      });

      // eslint-disable-next-line no-restricted-syntax -- Mock extension objects need double assertion to match Extension type.
      const extensions = [{ value: '    ' }] as unknown as Extension[];
      const next = vi.fn().mockReturnValue(extensions);

      const result = asPrivate(plugin).getDynamicExtensions(next, {});

      expect(result).toBe(extensions);
      // eslint-disable-next-line no-restricted-syntax -- Accessing mock extension value property needs double assertion.
      expect((result[0] as unknown as ExtensionWithValue).value).toBe('    ');
    });

    it('should replace tab size when useTab is false and tabSize differs from 4', () => {
      const TAB_SIZE = 2;
      mockApp.vault.getConfig.mockImplementation((key: string) => {
        if (key === 'useTab') {
          return false;
        }
        if (key === 'tabSize') {
          return TAB_SIZE;
        }
        return undefined;
      });

      // eslint-disable-next-line no-restricted-syntax -- Mock extension objects need double assertion to match Extension type.
      const extensions = [{ value: '    ' }] as unknown as Extension[];
      const next = vi.fn().mockReturnValue(extensions);

      const result = asPrivate(plugin).getDynamicExtensions(next, {});

      // eslint-disable-next-line no-restricted-syntax -- Accessing mock extension value property needs double assertion.
      expect((result[0] as unknown as ExtensionWithValue).value).toBe('  ');
    });

    it('should not modify extensions when no matching tab size extension is found', () => {
      const TAB_SIZE = 2;
      mockApp.vault.getConfig.mockImplementation((key: string) => {
        if (key === 'useTab') {
          return false;
        }
        if (key === 'tabSize') {
          return TAB_SIZE;
        }
        return undefined;
      });

      // eslint-disable-next-line no-restricted-syntax -- Mock extension objects need double assertion to match Extension type.
      const extensions = [{ value: 'something-else' }] as unknown as Extension[];
      const next = vi.fn().mockReturnValue(extensions);

      const result = asPrivate(plugin).getDynamicExtensions(next, {});

      // eslint-disable-next-line no-restricted-syntax -- Accessing mock extension value property needs double assertion.
      expect((result[0] as unknown as ExtensionWithValue).value).toBe('something-else');
    });

    it('should handle extensions without value property', () => {
      const TAB_SIZE = 2;
      mockApp.vault.getConfig.mockImplementation((key: string) => {
        if (key === 'useTab') {
          return false;
        }
        if (key === 'tabSize') {
          return TAB_SIZE;
        }
        return undefined;
      });

      // eslint-disable-next-line no-restricted-syntax -- Mock extension objects need double assertion to match Extension type.
      const extensions = [{}] as unknown as Extension[];
      const next = vi.fn().mockReturnValue(extensions);

      const result = asPrivate(plugin).getDynamicExtensions(next, {});

      expect(result).toBe(extensions);
    });
  });
});
