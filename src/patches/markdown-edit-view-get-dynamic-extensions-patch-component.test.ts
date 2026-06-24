import type { Extension } from '@codemirror/state';
import type {
  App as AppOriginal,
  MarkdownEditView
} from 'obsidian';

import { castTo } from 'obsidian-dev-utils/object-utils';
import { App } from 'obsidian-test-mocks/obsidian';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import { MarkdownEditViewGetDynamicExtensionsPatchComponent } from './markdown-edit-view-get-dynamic-extensions-patch-component.ts';

interface EditModeContext {
  editMode: MarkdownEditView;
  nextExtensions: ExtensionsHolder;
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

const HARDCODED_TAB_SIZE = 4;
const DIFFERENT_TAB_SIZE = 2;

describe('MarkdownEditViewGetDynamicExtensionsPatchComponent', () => {
  let appMock: App;
  let app: AppOriginal;
  let getConfig: ReturnType<typeof vi.fn>;
  let editMode: MarkdownEditView;
  let nextExtensions: ExtensionsHolder;
  const loadedComponents: MarkdownEditViewGetDynamicExtensionsPatchComponent[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    appMock = App.createConfigured__();
    getConfig = vi.fn();
    castTo<GetConfigHolder>(appMock.vault).getConfig = getConfig;
    app = appMock.asOriginalType__();

    const context = createEditMode();
    editMode = context.editMode;
    nextExtensions = context.nextExtensions;
  });

  afterEach(() => {
    while (loadedComponents.length > 0) {
      loadedComponents.pop()?.unload();
    }
    vi.restoreAllMocks();
  });

  it('should pass extensions through unchanged when useTab is true', () => {
    loadComponent();
    getConfig.mockImplementation((key: string) => key === 'useTab');
    nextExtensions.value = makeExtensions('    ');

    const result = editMode.getDynamicExtensions();

    expect(result).toBe(nextExtensions.value);
  });

  it('should not modify extensions when tabSize equals the hardcoded value', () => {
    loadComponent();
    getConfig.mockImplementation((key: string) => key === 'tabSize' ? HARDCODED_TAB_SIZE : false);
    nextExtensions.value = makeExtensions('    ');

    const result = editMode.getDynamicExtensions();

    expect(extensionValue(result[0])).toBe('    ');
  });

  it('should rewrite the tab-size extension when useTab is false and tabSize differs', () => {
    loadComponent();
    getConfig.mockImplementation((key: string) => key === 'tabSize' ? DIFFERENT_TAB_SIZE : false);
    nextExtensions.value = makeExtensions('    ');

    const result = editMode.getDynamicExtensions();

    expect(extensionValue(result[0])).toBe('  ');
  });

  it('should not modify extensions when no matching tab-size extension is found', () => {
    loadComponent();
    getConfig.mockImplementation((key: string) => key === 'tabSize' ? DIFFERENT_TAB_SIZE : false);
    nextExtensions.value = makeExtensions('something-else');

    const result = editMode.getDynamicExtensions();

    expect(extensionValue(result[0])).toBe('something-else');
  });

  it('should ignore extensions without a value property', () => {
    loadComponent();
    getConfig.mockImplementation((key: string) => key === 'tabSize' ? DIFFERENT_TAB_SIZE : false);
    nextExtensions.value = castTo<Extension[]>([{}]);

    const result = editMode.getDynamicExtensions();

    expect(result).toBe(nextExtensions.value);
  });

  function createEditMode(): EditModeContext {
    const holder: ExtensionsHolder = { value: [] };

    class EditModeGrandparent {
      public getDynamicExtensions(): Extension[] {
        return holder.value;
      }
    }
    class EditModeParent extends EditModeGrandparent {}
    class EditModeChild extends EditModeParent {}

    return {
      editMode: castTo<MarkdownEditView>(new EditModeChild()),
      nextExtensions: holder
    };
  }

  function loadComponent(): void {
    const component = new MarkdownEditViewGetDynamicExtensionsPatchComponent({
      app,
      markdownEditView: editMode
    });
    component.load();
    loadedComponents.push(component);
  }
});

function extensionValue(extension: Extension | undefined): string | undefined {
  return castTo<ExtensionWithValue | undefined>(extension)?.value;
}

function makeExtensions(value: string): Extension[] {
  return castTo<Extension[]>([{ value }]);
}
