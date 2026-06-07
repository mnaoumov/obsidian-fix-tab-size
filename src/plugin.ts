import type { Extension } from '@codemirror/state';
import type {
  App,
  PluginManifest
} from 'obsidian';

import { ViewType } from '@obsidian-typings/obsidian-public-latest/implementations';
import {
  MarkdownEditView,
  MarkdownView
} from 'obsidian';
import { getPrototypeOf } from 'obsidian-dev-utils/object-utils';
import { MonkeyAroundComponent } from 'obsidian-dev-utils/obsidian/components/monkey-around-component';
import { PluginBase } from 'obsidian-dev-utils/obsidian/plugin/plugin';

type ExtensionWithValue = {
  value: string;
} & Extension;

type GetDynamicExtensionsFn = MarkdownEditView['getDynamicExtensions'];

const HARDCODED_TAB_SIZE = 4;

export class Plugin extends PluginBase {
  private isPatched = false;
  private readonly monkeyAroundComponent: MonkeyAroundComponent;

  public constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.monkeyAroundComponent = this.addChild(new MonkeyAroundComponent());
    this.registerEvent(this.app.workspace.on('layout-change', this.patchDynamicExtensions.bind(this)));
  }

  private getDynamicExtensions(next: GetDynamicExtensionsFn, markdownEditView: MarkdownEditView): Extension[] {
    const extensions = next.call(markdownEditView);

    if (!this.app.vault.getConfig('useTab')) {
      const tabSize = this.app.vault.getConfig('tabSize') as number;
      if (tabSize !== HARDCODED_TAB_SIZE) {
        const tabSizeExtension = extensions.find((extension: Extension) =>
          (extension as Partial<ExtensionWithValue>).value === ' '.repeat(HARDCODED_TAB_SIZE)
        ) as
          | ExtensionWithValue
          | null;
        if (tabSizeExtension) {
          tabSizeExtension.value = ' '.repeat(tabSize);
        }
      }
    }

    return extensions;
  }

  private patchDynamicExtensions(): void {
    if (this.isPatched) {
      return;
    }

    const markdownViews = this.app.workspace.getLeavesOfType(ViewType.Markdown).flatMap((leaf) => leaf.view instanceof MarkdownView ? [leaf.view] : []);

    if (markdownViews.length === 0 || !markdownViews[0]) {
      return;
    }

    this.isPatched = true;

    const proto = getPrototypeOf(getPrototypeOf(getPrototypeOf(markdownViews[0].editMode)));
    const that = this;
    this.monkeyAroundComponent.registerPatch(proto, {
      /* v8 ignore start -- Runtime-only callback executed inside Obsidian's patched method. */
      getDynamicExtensions: (next: GetDynamicExtensionsFn): GetDynamicExtensionsFn => {
        return function getDynamicExtensionsPatched(this: MarkdownEditView): Extension[] {
          return that.getDynamicExtensions(next, this);
        };
      }
      /* v8 ignore stop */
    });

    for (const markdownView of markdownViews) {
      markdownView.editMode.updateOptions();
    }
  }
}
