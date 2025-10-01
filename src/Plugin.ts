import type { Extension } from '@codemirror/state';

import {
  MarkdownEditView,
  MarkdownView
} from 'obsidian';
import { getPrototypeOf } from 'obsidian-dev-utils/ObjectUtils';
import { registerPatch } from 'obsidian-dev-utils/obsidian/MonkeyAround';
import { PluginBase } from 'obsidian-dev-utils/obsidian/Plugin/PluginBase';

import type { PluginTypes } from './PluginTypes.ts';

import { PluginSettingsManager } from './PluginSettingsManager.ts';

type ExtensionWithValue = {
  value: string;
} & Extension;

type GetDynamicExtensionsFn = MarkdownEditView['getDynamicExtensions'];

export class Plugin extends PluginBase<PluginTypes> {
  private isPatched = false;

  protected override createSettingsManager(): PluginSettingsManager {
    return new PluginSettingsManager(this);
  }

  protected override createSettingsTab(): null {
    return null;
  }

  protected override async onloadImpl(): Promise<void> {
    await super.onloadImpl();

    this.registerEvent(this.app.workspace.on('file-open', this.handleFileOpen.bind(this)));
  }

  private getDynamicExtensions(next: GetDynamicExtensionsFn, markdownEditView: MarkdownEditView): Extension[] {
    const extensions = next.call(markdownEditView);

    if (!this.app.vault.getConfig('useTab')) {
      const tabSize = this.app.vault.getConfig('tabSize') as number;
      const HARDCODED_TAB_SIZE = 4;
      if (tabSize !== HARDCODED_TAB_SIZE) {
        const tabSizeExtension = extensions.find((extension) => (extension as Partial<ExtensionWithValue>).value === ' '.repeat(HARDCODED_TAB_SIZE)) as
          | ExtensionWithValue
          | null;
        if (tabSizeExtension) {
          tabSizeExtension.value = ' '.repeat(tabSize);
        }
      }
    }

    return extensions;
  }

  private handleFileOpen(): void {
    if (this.isPatched) {
      return;
    }

    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!markdownView) {
      return;
    }

    this.isPatched = true;

    const proto = getPrototypeOf(getPrototypeOf(getPrototypeOf(markdownView.editMode)));
    const that = this;
    registerPatch(this, proto, {
      getDynamicExtensions: (next: GetDynamicExtensionsFn): GetDynamicExtensionsFn => {
        return function getDynamicExtensionsPatched(this: MarkdownEditView): Extension[] {
          return that.getDynamicExtensions(next, this);
        };
      }
    });
  }
}
