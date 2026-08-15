import type { App } from 'obsidian';

import { Notice } from 'obsidian';

// This plugin has no settings of its own — it reacts to two of Obsidian's core editor settings, and
// It only does anything while `useTab` is FALSE. Both facts are easy to get wrong by hand, which is
// Why the buttons set them in pairs rather than one at a time.

const DEFAULT_TAB_SIZE = 4;

/**
 * Puts Obsidian into the state the plugin actually affects: indenting with SPACES, at a width other
 * than Obsidian's hardcoded four.
 *
 * Manual equivalent: turn OFF **Settings -> Editor -> Indent using tabs**, and set **Indent visual
 * width** to the same number.
 */
export function useSpaceIndent(app: App, tabSize: number): void {
  app.vault.setConfig('useTab', false);
  app.vault.setConfig('tabSize', tabSize);
  new Notice(`Indenting with ${String(tabSize)} spaces. Press Tab in a note and count them.`);
}

/**
 * Switches to indenting with real tab characters.
 *
 * The plugin is deliberately inert here — Obsidian already renders a tab at **Indent visual width**
 * on its own, so there is nothing to fix.
 *
 * Manual equivalent: turn ON **Settings -> Editor -> Indent using tabs**.
 */
export function useTabIndent(app: App, tabSize: number): void {
  app.vault.setConfig('useTab', true);
  app.vault.setConfig('tabSize', tabSize);
  new Notice(`Indenting with tabs, drawn ${String(tabSize)} wide. The plugin changes nothing here.`);
}

/**
 * Restores Obsidian's defaults: tabs, four wide.
 *
 * Manual equivalent: turn **Indent using tabs** back on and set **Indent visual width** to 4.
 */
export function restoreDefaults(app: App): void {
  app.vault.setConfig('useTab', true);
  app.vault.setConfig('tabSize', DEFAULT_TAB_SIZE);
  new Notice('Editor indent settings restored.');
}
