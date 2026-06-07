import type { Extension } from '@codemirror/state';
import type {
  App,
  PluginManifest
} from 'obsidian';

import { castTo } from 'obsidian-dev-utils/object-utils';
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

interface MockAppShape {
  vault: MockVault;
  workspace: MockWorkspace;
}

interface MockEditMode {
  updateOptions: ReturnType<typeof vi.fn>;
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

type PatchMap = Record<string, (next: (...args: unknown[]) => unknown) => (...args: unknown[]) => unknown>;

interface PluginPrivateMethods {
  getDynamicExtensions(next: () => Extension[], markdownEditView: unknown): Extension[];
  isPatched: boolean;
  patchDynamicExtensions(): void;
}

function noopFn(): void {
  // Intentional no-op: default function when no original exists on the target.
}

vi.mock('obsidian-dev-utils/obsidian/components/monkey-around-component', () => ({
  MonkeyAroundComponent: class MockMonkeyAroundComponent {
    public registerPatch(target: object, patches: PatchMap): void {
      for (const [key, factory] of Object.entries(patches)) {
        const original = (target as Record<string, (...args: unknown[]) => unknown>)[key] ?? noopFn;
        (target as Record<string, unknown>)[key] = factory(original);
      }
    }
  }
}));

vi.mock('obsidian-dev-utils/object-utils', () => ({
  castTo: (value: unknown): unknown => value,
  getPrototypeOf: vi.fn((obj: unknown) => Object.getPrototypeOf(obj as object))
}));

vi.mock('obsidian-dev-utils/obsidian/plugin/plugin', () => {
  class MockPluginBase {
    public app: App;
    public manifest: PluginManifest;

    public constructor(app: App, manifest: PluginManifest) {
      this.app = app;
      this.manifest = manifest;
    }

    public addChild<T>(child: T): T {
      return child;
    }

    public register(): void {
      // Noop
    }

    public registerEvent(): void {
      // Noop
    }
  }
  return { PluginBase: MockPluginBase };
});

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
import { Plugin } from './plugin.ts';

function asPrivate(p: Plugin): PluginPrivateMethods {
  // eslint-disable-next-line no-restricted-syntax -- Accessing private methods for testing needs double assertion.
  return p as unknown as PluginPrivateMethods;
}

function createMockApp(): App {
  const mockWorkspace: MockWorkspace = {
    getLeavesOfType: vi.fn().mockReturnValue([]),
    on: vi.fn().mockReturnValue({ id: 'event-ref' })
  };
  const mockVault: MockVault = {
    getConfig: vi.fn()
  };
  return castTo<App>({
    vault: mockVault,
    workspace: mockWorkspace
  });
}

function createMockMarkdownView(): MockMarkdownView {
  // eslint-disable-next-line no-restricted-syntax -- Mocked MarkdownView constructor takes no args, real signature expects a leaf.
  const MockedMarkdownView = MarkdownView as unknown as new () => MarkdownView;
  const view = new MockedMarkdownView();
  // eslint-disable-next-line no-restricted-syntax -- Mocked class needs double assertion to match interface.
  return view as unknown as MockMarkdownView;
}

function getMockApp(app: App): MockAppShape {
  // eslint-disable-next-line no-restricted-syntax -- castTo used to extract mock shape from App type.
  return app as unknown as MockAppShape;
}

describe('Plugin', () => {
  let plugin: Plugin;
  let mockApp: App;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApp = createMockApp();
    plugin = new Plugin(mockApp, castTo<PluginManifest>({ id: 'fix-tab-size' }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register layout-change event on construction', () => {
    const { workspace } = getMockApp(mockApp);

    expect(workspace.on).toHaveBeenCalledWith('layout-change', expect.any(Function));
  });

  describe('patchDynamicExtensions', () => {
    it('should return early if already patched', () => {
      asPrivate(plugin).isPatched = true;
      const { workspace } = getMockApp(mockApp);

      asPrivate(plugin).patchDynamicExtensions();

      expect(workspace.getLeavesOfType).not.toHaveBeenCalled();
    });

    it('should return early if no markdown views exist', () => {
      const { workspace } = getMockApp(mockApp);
      workspace.getLeavesOfType.mockReturnValue([]);

      asPrivate(plugin).patchDynamicExtensions();

      expect(asPrivate(plugin).isPatched).toBe(false);
    });

    it('should return early if views are not MarkdownView instances', () => {
      const { workspace } = getMockApp(mockApp);
      const nonMarkdownLeaf = { view: { editMode: { updateOptions: vi.fn() } } };
      workspace.getLeavesOfType.mockReturnValue([nonMarkdownLeaf]);

      asPrivate(plugin).patchDynamicExtensions();

      expect(asPrivate(plugin).isPatched).toBe(false);
    });

    it('should patch and update markdown views when available', () => {
      const { workspace } = getMockApp(mockApp);
      const mockView = createMockMarkdownView();
      workspace.getLeavesOfType.mockReturnValue([{ view: mockView }]);

      asPrivate(plugin).patchDynamicExtensions();

      expect(asPrivate(plugin).isPatched).toBe(true);
      expect(mockView.editMode.updateOptions).toHaveBeenCalled();
    });

    it('should update all markdown views after patching', () => {
      const { workspace } = getMockApp(mockApp);
      const mockView1 = createMockMarkdownView();
      const mockView2 = createMockMarkdownView();
      workspace.getLeavesOfType.mockReturnValue([{ view: mockView1 }, { view: mockView2 }]);

      asPrivate(plugin).patchDynamicExtensions();

      expect(mockView1.editMode.updateOptions).toHaveBeenCalled();
      expect(mockView2.editMode.updateOptions).toHaveBeenCalled();
    });

    it('should not re-patch if already patched on second call', () => {
      const { workspace } = getMockApp(mockApp);
      const mockView = createMockMarkdownView();
      workspace.getLeavesOfType.mockReturnValue([{ view: mockView }]);

      asPrivate(plugin).patchDynamicExtensions();
      vi.clearAllMocks();
      asPrivate(plugin).patchDynamicExtensions();

      expect(workspace.getLeavesOfType).not.toHaveBeenCalled();
    });
  });

  describe('getDynamicExtensions', () => {
    it('should pass through extensions when useTab is true', () => {
      const { vault } = getMockApp(mockApp);
      vault.getConfig.mockImplementation((key: string) => {
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
      const { vault } = getMockApp(mockApp);
      vault.getConfig.mockImplementation((key: string) => {
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
      const { vault } = getMockApp(mockApp);
      vault.getConfig.mockImplementation((key: string) => {
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
      const { vault } = getMockApp(mockApp);
      vault.getConfig.mockImplementation((key: string) => {
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
      const { vault } = getMockApp(mockApp);
      vault.getConfig.mockImplementation((key: string) => {
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
