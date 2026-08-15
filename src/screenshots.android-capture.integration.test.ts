/**
 * @file
 *
 * Produces the mobile screenshots the community-store listing needs
 * (T461-P21), driving a staged note in Obsidian Mobile on a real Android
 * emulator and writing `images/screenshots/screenshot-mobile-N.png`.
 *
 * THREE shots, matching the desktop set: the problem, the fix, and the fix at a
 * different width. This plugin has one behavior, and the shot count is a
 * ceiling rather than a quota.
 *
 * What differs is how the indent is produced. The desktop suite presses a real
 * `Tab` key; a phone has no Tab key, and the harness's `pressKey` injects
 * through Electron and does not exist on Android at all. Obsidian Mobile
 * indents from the toolbar button instead, which runs the editor's own
 * `indentMore` — so that is what these shots run, and it is the honest mobile
 * equivalent rather than a simulated keystroke.
 *
 * There is no mobile equivalent of the desktop viewport override, so the capture
 * is always the device's own framebuffer, and the AVD is built at exactly
 * 900x1600 — see [[T461-P21]] for its one-time provisioning.
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
 * `App`, reduced to the font-size applier that `obsidian-typings` does not
 * declare. Setting `baseFontSize` alone changes nothing on screen.
 */
interface FontSizeApp {
  updateFontSize(this: void): void;
}

/**
 * `App`, reduced to the inline-title applier, likewise undeclared.
 */
interface InlineTitleApp {
  updateInlineTitleDisplay(this: void): void;
}

const PLUGIN_ID = 'fix-tab-size';
const WIDTH_IN_PIXELS = 900;
const HEIGHT_IN_PIXELS = 1600;

/**
 * The staged note every shot types into.
 */
const SUBJECT_NOTE_PATH = 'Screenshots/Indentation.md';

const WIDE_TAB_SIZE = 8;
const NARROW_TAB_SIZE = 2;

/**
 * What Obsidian indents by on its own, whatever the setting says.
 */
const OBSIDIAN_HARDCODED_TAB_SIZE = 4;

/**
 * Base font size for the mobile shots. Below Obsidian's own 16px default, so an
 * eight-space indent plus its label still fits a 450dp screen.
 */
const MOBILE_FONT_SIZE_IN_PIXELS = 13;

const IMAGES_DIRECTORY = join(process.cwd(), 'images', 'screenshots');

/**
 * Diagnostics from the setup closure, surfaced by the first test so a failed
 * mobile layout is readable instead of silent.
 */
let setupDiagnostics: unknown;

beforeAll(async () => {
  const vault = getTemporaryVault();

  vault.populate({ [SUBJECT_NOTE_PATH]: buildSubjectNote() });
  await vault.syncToDevice();

  setupDiagnostics = await evalInObsidian({
    async callback({ app, fontSizeInPixels, lib: { waitUntil }, subjectNotePath }) {
      // A closure runs inside ONE Appium `execute/sync` call, which WebDriver
      // Caps around 30s. A longer wait in here dies as an opaque `script
      // Timeout` rather than a readable failure, so keep every wait under it.
      const SETTLE_TIMEOUT_IN_MILLISECONDS = 20_000;
      const SETTLE_DELAY_IN_MILLISECONDS = 1500;

      app.changeTheme('obsidian');

      await waitUntil({
        message: 'the staged note to appear in the vault',
        predicate: () => Boolean(app.vault.getFileByPath(subjectNotePath)),
        timeoutInMilliseconds: SETTLE_TIMEOUT_IN_MILLISECONDS
      });

      // The indent has to be made of SPACES for any of this to be visible —
      // With `Indent using tabs` on it inserts one tab character and the
      // Question never arises.
      app.vault.setConfig('useTab', false);

      app.vault.setConfig('baseFontSize', fontSizeInPixels);
      const fontApp: unknown = app;
      (fontApp as FontSizeApp).updateFontSize();

      // The note opens with its own `# H1`, so the inline title doubles it.
      app.vault.setConfig('showInlineTitle', false);
      (fontApp as InlineTitleApp).updateInlineTitleDisplay();

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);

      return { isNoteStaged: Boolean(app.vault.getFileByPath(subjectNotePath)) };
    },
    input: { fontSizeInPixels: MOBILE_FONT_SIZE_IN_PIXELS, subjectNotePath: SUBJECT_NOTE_PATH },
    vaultPath: vaultPath()
  });
});

describe('mobile store screenshots', () => {
  it('stages the note the shots are framed on', () => {
    // Surfaced as an assertion because vitest swallows console output from an
    // Integration worker, and a silently-wrong layout produces bad images
    // Without a single failure.
    expect(setupDiagnostics).toMatchObject({ isNoteStaged: true });
  });

  it('1 - indenting ignoring the setting, with the plugin off', async () => {
    await setPluginEnabled(false);
    const indents = await typeIndentedLines(WIDE_TAB_SIZE);
    expect(indents).toStrictEqual([OBSIDIAN_HARDCODED_TAB_SIZE, OBSIDIAN_HARDCODED_TAB_SIZE * 2]);
    await shoot(1, `Indent visual width ${String(WIDE_TAB_SIZE)}, and indenting still adds ${String(OBSIDIAN_HARDCODED_TAB_SIZE)} spaces`);
    await setPluginEnabled(true);
  });

  it('2 - indenting honoring the setting, with the plugin on', async () => {
    const indents = await typeIndentedLines(WIDE_TAB_SIZE);
    expect(indents).toStrictEqual([WIDE_TAB_SIZE, WIDE_TAB_SIZE * 2]);
    await shoot(2, `With the plugin: indenting adds the ${String(WIDE_TAB_SIZE)} you asked for`);
  });

  it('3 - the same at a narrow width', async () => {
    const indents = await typeIndentedLines(NARROW_TAB_SIZE);
    expect(indents).toStrictEqual([NARROW_TAB_SIZE, NARROW_TAB_SIZE * 2]);
    await shoot(3, `Set ${String(NARROW_TAB_SIZE)}, and indenting adds ${String(NARROW_TAB_SIZE)}`);
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
      // Like the disabled one.
      app.workspace.trigger('layout-change');

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);
    },
    input: { isEnabled, pluginId: PLUGIN_ID },
    vaultPath: vaultPath()
  });
}

/**
 * Captures the device screen, captions it, and writes it as
 * `images/screenshots/screenshot-mobile-<index>.png`.
 *
 * @param index - The 1-based listing position.
 * @param caption - The caption drawn across the bottom of the frame.
 */
async function shoot(index: number, caption: string): Promise<void> {
  const captured = await captureObsidianScreenshot({ vaultPath: vaultPath() });

  // The AVD is 900x1600, so the device frame IS the store's size. Asserting it
  // Here is what keeps that true: run this against any other AVD and it fails
  // Loudly instead of quietly shipping an off-spec image.
  expect(readPngDimensions(captured)).toStrictEqual({
    heightInPixels: HEIGHT_IN_PIXELS,
    widthInPixels: WIDTH_IN_PIXELS
  });

  // Captioned AFTER capture, so the frame stays an untouched device screenshot
  // And rewording a label needs no re-shoot.
  const labeled = await labelScreenshot(captured, { text: caption });

  mkdirSync(IMAGES_DIRECTORY, { recursive: true });
  writeFileSync(join(IMAGES_DIRECTORY, `screenshot-mobile-${String(index)}.png`), labeled);
}

/**
 * Resets the note, then writes two lines indented through the editor's own
 * `indentMore` — one level for the first, two for the second.
 *
 * @param tabSize - The indent width to set before indenting.
 * @returns The leading-space count of each line, so the caller can assert what
 * was actually inserted rather than trusting the picture.
 */
async function typeIndentedLines(tabSize: number): Promise<number[]> {
  return await evalInObsidian({
    async callback({ app, lib: { waitUntil }, obsidianModule, subjectNotePath, tabSize: size }) {
      const RENDER_TIMEOUT_IN_MILLISECONDS = 15_000;
      const STEP_SETTLE_DELAY_IN_MILLISECONDS = 250;
      const SETTLE_DELAY_IN_MILLISECONDS = 1200;
      const LINE_COUNT = 2;

      app.vault.setConfig('tabSize', size);

      const file = app.vault.getFileByPath(subjectNotePath);
      if (!file) {
        throw new Error(`Note is missing from the vault: ${subjectNotePath}`);
      }

      // Back to the base note, so each shot writes into the same blank slate
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
        editor.setLine(editor.lastLine(), `${editor.getLine(editor.lastLine())}\nlevel ${String(lineIndex)}`);
        editor.setCursor(editor.lastLine(), 0);

        // What the mobile toolbar's indent button runs. One level for the first
        // Line, two for the second: a single level can be read as a
        // Coincidence, two show the width compounding.
        for (let press = 0; press < lineIndex; press++) {
          editor.exec('indentMore');
          await sleep(STEP_SETTLE_DELAY_IN_MILLISECONDS);
        }
      }

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);

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
