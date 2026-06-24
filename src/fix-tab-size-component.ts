import type { App } from 'obsidian';

import { ViewType } from '@obsidian-typings/obsidian-public-latest/implementations';
import { MarkdownView } from 'obsidian';
import { ComponentEx } from 'obsidian-dev-utils/obsidian/components/component-ex';

import { MarkdownEditViewGetDynamicExtensionsPatchComponent } from './patches/markdown-edit-view-get-dynamic-extensions-patch-component.ts';

interface FixTabSizeComponentConstructorParams {
  readonly app: App;
}

export class FixTabSizeComponent extends ComponentEx {
  private readonly app: App;
  private isPatched = false;

  public constructor(params: FixTabSizeComponentConstructorParams) {
    super();
    this.app = params.app;
  }

  public override onload(): void {
    this.registerEvent(this.app.workspace.on('layout-change', this.patchDynamicExtensions.bind(this)));
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

    this.addChild(
      new MarkdownEditViewGetDynamicExtensionsPatchComponent({
        app: this.app,
        markdownEditView: markdownViews[0].editMode
      })
    );

    for (const markdownView of markdownViews) {
      markdownView.editMode.updateOptions();
    }
  }
}
