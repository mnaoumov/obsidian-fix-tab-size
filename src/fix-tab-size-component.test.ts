import type { Extension } from '@codemirror/state';
import type {
  App as AppOriginal,
  MarkdownEditView,
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

import { FixTabSizeComponent } from './fix-tab-size-component.ts';

interface EditModeContext {
  editMode: MarkdownEditView;
  updateOptions: ReturnType<typeof vi.fn>;
}

interface EditModeHolder {
  editMode: MarkdownEditView;
}

describe('FixTabSizeComponent', () => {
  let appMock: App;
  let app: AppOriginal;
  const loadedComponents: FixTabSizeComponent[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    appMock = App.createConfigured__();
    app = appMock.asOriginalType__();
  });

  afterEach(() => {
    while (loadedComponents.length > 0) {
      loadedComponents.pop()?.unload();
    }
    vi.restoreAllMocks();
  });

  it('should update the open markdown view after patching on layout change', () => {
    const { editMode, updateOptions } = createEditMode();
    setLeaves([createMarkdownLeaf(editMode)]);

    loadComponent();
    appMock.workspace.trigger('layout-change');

    expect(updateOptions).toHaveBeenCalledTimes(1);
  });

  it('should update every open markdown view after patching', () => {
    const first = createEditMode();
    const second = createEditMode();
    setLeaves([createMarkdownLeaf(first.editMode), createMarkdownLeaf(second.editMode)]);

    loadComponent();
    appMock.workspace.trigger('layout-change');

    expect(first.updateOptions).toHaveBeenCalledTimes(1);
    expect(second.updateOptions).toHaveBeenCalledTimes(1);
  });

  it('should not re-patch on a second layout change', () => {
    const { editMode, updateOptions } = createEditMode();
    setLeaves([createMarkdownLeaf(editMode)]);

    loadComponent();
    appMock.workspace.trigger('layout-change');
    const getLeavesOfType = vi.mocked(appMock.workspace.getLeavesOfType);
    getLeavesOfType.mockClear();
    updateOptions.mockClear();

    appMock.workspace.trigger('layout-change');

    expect(getLeavesOfType).not.toHaveBeenCalled();
    expect(updateOptions).not.toHaveBeenCalled();
  });

  it('should not patch when no markdown views exist', () => {
    const { updateOptions } = createEditMode();
    setLeaves([]);

    loadComponent();
    appMock.workspace.trigger('layout-change');

    expect(updateOptions).not.toHaveBeenCalled();
  });

  it('should not patch when leaves are not markdown views', () => {
    const { updateOptions } = createEditMode();
    const nonMarkdownLeaf = castTo<WorkspaceLeaf>({ view: { editMode: { updateOptions } } });
    setLeaves([nonMarkdownLeaf]);

    loadComponent();
    appMock.workspace.trigger('layout-change');

    expect(updateOptions).not.toHaveBeenCalled();
  });

  function createEditMode(): EditModeContext {
    class EditModeGrandparent {
      public getDynamicExtensions(): Extension[] {
        return [];
      }
    }
    class EditModeParent extends EditModeGrandparent {}
    const updateOptions = vi.fn();
    class EditModeChild extends EditModeParent {
      public updateOptions = updateOptions;
    }

    return {
      editMode: castTo<MarkdownEditView>(new EditModeChild()),
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

  function loadComponent(): void {
    const component = new FixTabSizeComponent({ app });
    component.load();
    loadedComponents.push(component);
  }
});
