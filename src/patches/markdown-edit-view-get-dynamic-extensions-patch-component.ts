import type { Extension } from '@codemirror/state';
import type {
  App,
  MarkdownEditView
} from 'obsidian';

import { getPrototypeOf } from 'obsidian-dev-utils/object-utils';
import { MonkeyAroundComponent } from 'obsidian-dev-utils/obsidian/components/monkey-around-component';

interface ExtensionValue {
  value: string;
}

type ExtensionWithValue = Extension & ExtensionValue;

interface MarkdownEditViewGetDynamicExtensionsPatchComponentConstructorParams {
  readonly app: App;
  readonly markdownEditView: MarkdownEditView;
}

const HARDCODED_TAB_SIZE = 4;

export class MarkdownEditViewGetDynamicExtensionsPatchComponent extends MonkeyAroundComponent {
  private readonly app: App;
  private readonly markdownEditView: MarkdownEditView;
  public constructor(params: MarkdownEditViewGetDynamicExtensionsPatchComponentConstructorParams) {
    super();
    this.app = params.app;
    this.markdownEditView = params.markdownEditView;
  }

  public override onload(): void {
    this.registerMethodPatch({
      $object: getPrototypeOf(getPrototypeOf(getPrototypeOf(this.markdownEditView))),
      methodName: 'getDynamicExtensions',
      patchHandler: ({
        fallback
      }) => {
        const extensions = fallback();

        if (!this.app.vault.getConfig('useTab')) {
          const tabSize = this.app.vault.getConfig('tabSize') as number;
          if (tabSize !== HARDCODED_TAB_SIZE) {
            const tabSizeExtension = extensions.find((extension: Extension) => (extension as Partial<ExtensionWithValue>).value === ' '.repeat(HARDCODED_TAB_SIZE)) as
              | ExtensionWithValue
              | null;
            if (tabSizeExtension) {
              tabSizeExtension.value = ' '.repeat(tabSize);
            }
          }
        }

        return extensions;
      }
    });
  }
}
