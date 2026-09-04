/**
 * @file
 *
 * Produces the desktop screenshots the community-store listing needs
 * (T461-P21), driving a staged note in a real Obsidian and writing
 * `images/screenshots/screenshot-desktop-N.png`.
 *
 * THREE shots, not five. This plugin has exactly one behavior, and the shot
 * count is a ceiling rather than a quota — padding a listing with
 * near-duplicates makes it worse.
 *
 * What the plugin changes is what pressing `Tab` INSERTS, not how an existing
 * tab character is drawn. That distinction is the whole storyboard, and getting
 * it wrong the first time produced three frames that were identical: a note
 * containing literal tab characters renders at the configured width with the
 * plugin off, because Obsidian already honors the setting for RENDERING. It is
 * insertion that ignores it — `Tab` puts in four spaces whatever the setting
 * says. So every shot here TYPES: it presses `Tab` and types a label, and the
 * frame is the indentation that press produced.
 *
 * Each shot also ASSERTS the leading-space count it expects, so a frame can
 * never quietly show the wrong thing — which is exactly how the first attempt
 * went unnoticed until the numbers were measured.
 */

import {
  mkdirSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import {
  captureObsidianScreenshot,
  evalInObsidian,
  labelScreenshot,
  readPngDimensions
} from 'obsidian-integration-testing';
import { getTemporaryVault } from 'obsidian-integration-testing/vitest-global-setup-plugin';
import {
  beforeAll,
  describe,
  expect,
  it
} from 'vitest';

/**
 * `App`, reduced to the inline-title toggle that `obsidian-typings` does not
 * declare. Setting the config alone changes nothing on screen.
 */
interface InlineTitleApp {
  updateInlineTitleDisplay(this: void): void;
}

/**
 * The desktop side dock, reduced to the resize call.
 */
interface ResizableSideDock {
  setSize(this: void, size: number): void;
}

const PLUGIN_ID = 'fix-tab-size';
const WIDTH_IN_PIXELS = 1200;
const HEIGHT_IN_PIXELS = 800;

/**
 * The staged note every shot types into.
 */
const SUBJECT_NOTE_PATH = 'Screenshots/Indentation.md';

/**
 * The width the first two shots are taken at. Eight is twice Obsidian's own
 * hardcoded four, so the difference is unmistakable at listing-thumbnail size;
 * a smaller number would make the two frames hard to tell apart.
 */
const WIDE_TAB_SIZE = 8;

/**
 * The width the third shot proves the setting is actually being read at.
 */
const NARROW_TAB_SIZE = 2;

/**
 * What Obsidian inserts for a `Tab` on its own, whatever the setting says.
 */
const OBSIDIAN_HARDCODED_TAB_SIZE = 4;

const IMAGES_DIRECTORY = join(process.cwd(), 'images', 'screenshots');

beforeAll(async () => {
  const vault = getTemporaryVault();

  vault.populate({ [SUBJECT_NOTE_PATH]: buildSubjectNote() });
  await vault.syncToDevice();

  await evalInObsidian({
    async callback({ app, lib: { waitUntil }, subjectNotePath }) {
      const SETTLE_TIMEOUT_IN_MILLISECONDS = 30_000;
      const SETTLE_DELAY_IN_MILLISECONDS = 1000;

      app.changeTheme('obsidian');

      await waitUntil({
        message: 'the staged note to appear in the vault',
        predicate: () => Boolean(app.vault.getFileByPath(subjectNotePath)),
        timeoutInMilliseconds: SETTLE_TIMEOUT_IN_MILLISECONDS
      });

      // The indentation is the subject; the file explorer and an empty right
      // Dock would otherwise take a third of a 1200x800 frame.
      app.workspace.leftSplit.collapse();
      const rightSplit: unknown = app.workspace.rightSplit;
      (rightSplit as ResizableSideDock).setSize(0);
      app.workspace.rightSplit.collapse();

      // `Tab` has to insert SPACES for any of this to be visible — with
      // `Indent using tabs` on it inserts one tab character and the question
      // Never arises.
      app.vault.setConfig('useTab', false);

      // The note opens with its own `# H1`, so the inline title doubles it.
      app.vault.setConfig('showInlineTitle', false);
      const inlineTitleApp: unknown = app;
      (inlineTitleApp as InlineTitleApp).updateInlineTitleDisplay();

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);
    },
    input: { subjectNotePath: SUBJECT_NOTE_PATH },
    vaultPath: vaultPath()
  });
});

describe('desktop store screenshots', () => {
  it('1 - Tab ignoring the setting, with the plugin off', async () => {
    // A before-shot is only safe BECAUSE of the caption. A listing carousel
    // Shows screenshots one at a time, so an unlabelled one reads as a picture
    // Of what the plugin does, not of what it fixes.
    await setPluginEnabled(false);
    const indents = await typeIndentedLines(WIDE_TAB_SIZE);
    expect(indents).toStrictEqual([OBSIDIAN_HARDCODED_TAB_SIZE, OBSIDIAN_HARDCODED_TAB_SIZE * 2]);
    await shoot(1, `Indent visual width ${String(WIDE_TAB_SIZE)}, and Tab still inserts ${String(OBSIDIAN_HARDCODED_TAB_SIZE)} spaces`);
    await setPluginEnabled(true);
  });

  it('2 - Tab honoring the setting, with the plugin on', async () => {
    const indents = await typeIndentedLines(WIDE_TAB_SIZE);
    expect(indents).toStrictEqual([WIDE_TAB_SIZE, WIDE_TAB_SIZE * 2]);
    await shoot(2, `With the plugin: Tab inserts the ${String(WIDE_TAB_SIZE)} you asked for`);
  });

  it('3 - the same at a narrow width', async () => {
    // The second width is what shows the SETTING is being read, rather than one
    // Hardcoded number having been swapped for another.
    const indents = await typeIndentedLines(NARROW_TAB_SIZE);
    expect(indents).toStrictEqual([NARROW_TAB_SIZE, NARROW_TAB_SIZE * 2]);
    await shoot(3, `Set ${String(NARROW_TAB_SIZE)}, and Tab inserts ${String(NARROW_TAB_SIZE)}`);
  });
});

/**
 * Builds the note the shots type into.
 *
 * @returns The note's Markdown.
 */
function buildSubjectNote(): string {
  return '# Typing with Tab\n\ntop level\n';
}

/**
 * Enables or disables the plugin, for the one shot that shows the state its
 * absence leaves behind.
 *
 * @param isEnabled - Whether the plugin should be on.
 */
async function setPluginEnabled(isEnabled: boolean): Promise<void> {
  await evalInObsidian({
    async callback({ app, isEnabled: shouldEnable, pluginId }) {
      const SETTLE_DELAY_IN_MILLISECONDS = 1500;

      if (shouldEnable) {
        await app.plugins.enablePlugin(pluginId);
      } else {
        await app.plugins.disablePlugin(pluginId);
      }

      // Enabling is not enough on its own. The plugin installs its patch when a
      // `layout-change` fires and then guards against doing it twice, so a
      // Plugin re-enabled mid-session sits there unpatched and behaves exactly
      // Like the disabled one — which is what made all three frames identical.
      app.workspace.trigger('layout-change');

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);
    },
    input: { isEnabled, pluginId: PLUGIN_ID },
    vaultPath: vaultPath()
  });
}

/**
 * Captures the window, captions it, and writes it as
 * `images/screenshots/screenshot-desktop-<index>.png`.
 *
 * @param index - The 1-based listing position.
 * @param caption - The caption drawn across the bottom of the frame.
 */
async function shoot(index: number, caption: string): Promise<void> {
  const bytes = await captureObsidianScreenshot({
    heightInPixels: HEIGHT_IN_PIXELS,
    vaultPath: vaultPath(),
    widthInPixels: WIDTH_IN_PIXELS
  });

  const labeled = await labelScreenshot(bytes, { text: caption });

  expect(readPngDimensions(labeled)).toStrictEqual({
    heightInPixels: HEIGHT_IN_PIXELS,
    widthInPixels: WIDTH_IN_PIXELS
  });

  mkdirSync(IMAGES_DIRECTORY, { recursive: true });
  writeFileSync(join(IMAGES_DIRECTORY, `screenshot-desktop-${String(index)}.png`), labeled);
}

/**
 * Resets the note, then types two lines by pressing `Tab` and typing a label —
 * one press for the first line, two for the second.
 *
 * @param tabSize - The indent width to set before typing.
 * @returns The leading-space count of each typed line, so the caller can assert
 * what the press actually inserted rather than trusting the picture.
 */
async function typeIndentedLines(tabSize: number): Promise<number[]> {
  return await evalInObsidian({
    async callback({ app, lib: { pressKey, typeIntoEditor, waitUntil }, obsidianModule, subjectNotePath, tabSize: size }) {
      const RENDER_TIMEOUT_IN_MILLISECONDS = 20_000;
      const KEY_SETTLE_DELAY_IN_MILLISECONDS = 250;
      const SETTLE_DELAY_IN_MILLISECONDS = 1200;
      const RESIZE_SETTLE_DELAY_IN_MILLISECONDS = 2000;
      const LINE_COUNT = 2;

      // Let the previous shot's capture settle. `captureObsidianScreenshot`
      // Overrides the device metrics and clears them again, and the re-layout
      // That lands afterwards disturbs an editor being typed into.
      await sleep(RESIZE_SETTLE_DELAY_IN_MILLISECONDS);

      app.vault.setConfig('tabSize', size);

      const file = app.vault.getFileByPath(subjectNotePath);
      if (!file) {
        throw new Error(`Note is missing from the vault: ${subjectNotePath}`);
      }

      // Back to the base note, so each shot types into the same blank slate
      // Rather than onto the lines the previous shot left behind.
      await app.vault.modify(file, '# Typing with Tab\n\ntop level\n');

      const leaf = app.workspace.getLeaf(false);
      await leaf.openFile(file);
      // `source: true` forces RAW markdown, which is where indentation is the
      // Thing on screen rather than something the renderer has swallowed.
      await leaf.setViewState({
        state: { file: subjectNotePath, mode: 'source', source: true },
        type: 'markdown'
      });

      await waitUntil({
        message: 'the editor to render',
        predicate: () => Boolean(document.querySelector('.cm-content')),
        timeoutInMilliseconds: RENDER_TIMEOUT_IN_MILLISECONDS
      });

      const view = app.workspace.getActiveViewOfType(obsidianModule.MarkdownView);
      const editor = view?.editor;
      if (!editor) {
        throw new Error('The staged note did not open in an editor.');
      }

      for (let lineIndex = 1; lineIndex <= LINE_COUNT; lineIndex++) {
        editor.focus();
        editor.setCursor(editor.lastLine(), editor.getLine(editor.lastLine()).length);
        await pressKey({ key: 'Enter' });
        await sleep(KEY_SETTLE_DELAY_IN_MILLISECONDS);

        // Obsidian carries the previous line's indent onto the new one, so
        // Without this the second line measures its own two presses PLUS the
        // First line's indent and the numbers stop meaning what they say.
        editor.setLine(editor.lastLine(), '');
        editor.setCursor(editor.lastLine(), 0);

        // One press for the first line, two for the second: a single level can
        // Be read as a coincidence, two show the width compounding.
        for (let press = 0; press < lineIndex; press++) {
          await pressKey({ key: 'Tab' });
          await sleep(KEY_SETTLE_DELAY_IN_MILLISECONDS);
        }

        await typeIntoEditor({ editor, text: `level ${String(lineIndex)}` });
      }

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);

      // Counted from the EDITOR rather than the file: the file is only written
      // On save, and the frame is of what is on screen.
      const indents: number[] = [];
      for (let lineIndex = 1; lineIndex <= LINE_COUNT; lineIndex++) {
        const line = editor.getLine(editor.lastLine() - LINE_COUNT + lineIndex);
        indents.push(line.length - line.trimStart().length);
      }

      return indents;
    },
    input: { subjectNotePath: SUBJECT_NOTE_PATH, tabSize },
    vaultPath: vaultPath()
  });
}

function vaultPath(): string {
  return getTemporaryVault().path;
}
