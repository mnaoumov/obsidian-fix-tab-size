import { PluginBase } from 'obsidian-dev-utils/obsidian/plugin/plugin';

import { FixTabSizeComponent } from './fix-tab-size-component.ts';

export class Plugin extends PluginBase {
  protected override onloadImpl(): void {
    this.addChild(
      new FixTabSizeComponent({
        app: this.app
      })
    );
  }
}
