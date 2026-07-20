[Docs](https://github.com/mnaoumov/obsidian-fix-tab-size/)

# Fix tab size

Obsidian has an **Indent visual width** setting (**Settings -> Editor -> Indent visual width**), but the editor ignores it for real tab characters: a hard `Tab` is always rendered at Obsidian's own fixed width, no matter what you configured. **Fix Tab Size** makes the editor render each tab at the width you set, so tab-indented text lines up the way you expect.

## Try it

1. Open **Settings -> Editor** and note the **Indent visual width** value (the default is `4`).
2. Look at the tab-indented block below - each level is a single real tab character, not spaces.
3. Change **Indent visual width** to another value (for example `2` or `8`). With the plugin enabled, the visible indentation of the tabs updates to match.
4. Disable the plugin and reload Obsidian: the tabs snap back to the fixed rendering and ignore the setting again.

## Tab-indented sample

Each line below is indented with real `Tab` characters. Put your cursor at the start of the text on an indented line and press the left arrow once - it jumps over the whole indent in a single step, confirming it is one tab rather than several spaces.

<!-- markdownlint-disable MD010 -->
```text
root
	level 1 (one tab)
		level 2 (two tabs)
			level 3 (three tabs)
	back to level 1
```
<!-- markdownlint-enable MD010 -->

## What the plugin changes

The plugin patches the editor's set of dynamic extensions so the CodeMirror `tabSize` used for rendering follows **Indent visual width**. It only changes how existing tab characters are *displayed*; it never rewrites your note or converts tabs to spaces. Turn the plugin off and every tab is exactly the character it always was - only the on-screen width reverts.
