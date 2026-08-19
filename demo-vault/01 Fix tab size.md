# Fix tab size

Obsidian has an **Indent visual width** setting (**Settings -> Editor -> Indent visual width**), and it honours it for real tab characters. What it ignores it for is **spaces**: with **Indent using tabs** turned off, one level of indent is always **four** spaces, whatever width you configured. **Fix Tab Size** makes the space indent match the width you set.

![Obsidian's Indent visual width setting](<./_assets/images/tab-size.png>)

## Try it

The plugin only acts while **Indent using tabs** is OFF, so both settings have to be right before anything is visible. The button sets both:

```code-button
---
caption: Indent with 8 spaces
---
require('/demoSetup.ts').useSpaceIndent(app, 8);
```

Manual equivalent: turn OFF **Settings -> Editor -> Indent using tabs**, and set **Indent visual width** to `8`.

1. Put your cursor on the blank line below and press `Tab`.
2. Count the spaces it inserted: **eight**, matching the setting. With the plugin disabled it would be four, whatever the width says.
3. Try a different width and press `Tab` again, using the button below.

```code-button
---
caption: Indent with 2 spaces
---
require('/demoSetup.ts').useSpaceIndent(app, 2);
```

## Where the plugin does nothing, on purpose

Real tab characters never needed fixing - Obsidian already draws a `Tab` at **Indent visual width**:

```code-button
---
caption: Indent with tabs instead
---
require('/demoSetup.ts').useTabIndent(app, 8);
```

Manual equivalent: turn ON **Indent using tabs**.

Press `Tab` now and you get one tab character, drawn eight wide - the same with the plugin enabled or disabled. If you indent with tabs, this plugin has nothing to do for you.

```code-button
---
caption: Restore Obsidian's defaults (tabs, 4 wide)
---
require('/demoSetup.ts').restoreDefaults(app);
```

## What the plugin changes

Obsidian builds its editor extensions with the equivalent of:

```js
extensions.push(tabSize.of(indentVisualWidth));           // real tabs already follow the setting
extensions.push(indentUnit.of(useTab ? '\t' : '    '));   // spaces are hardcoded to four
```

The plugin patches that second line: while `useTab` is off, it replaces the four-space indent unit with one of **Indent visual width** spaces. It only changes what a new indent *inserts* and how existing indentation is measured; it never rewrites your notes or converts tabs to spaces.
