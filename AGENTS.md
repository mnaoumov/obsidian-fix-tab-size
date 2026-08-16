# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Fix Tab Size is an Obsidian plugin that makes one indent insert as many spaces as the vault's **Indent visual width** (`tabSize`), replacing the four-space indent unit Obsidian hardcodes on its spaces branch. It acts only while **Indent using tabs** (`useTab`) is off; with tabs on Obsidian already draws a tab at the configured width, so the plugin is inert by design. It is built on `obsidian-dev-utils`.

## Commands

| Task              | Command                    |
|-------------------|----------------------------|
| TypeScript check  | `npm run build:compile`    |
| Build             | `npm run build`            |
| Dev (watch)       | `npm run dev`              |
| Lint              | `npm run lint`             |
| Lint (fix)        | `npm run lint:fix`         |
| Format            | `npm run format`           |
| Format (check)    | `npm run format:check`     |
| Spellcheck        | `npm run spellcheck`       |
| Markdown lint     | `npm run lint:md`          |
| Markdown lint fix | `npm run lint:md:fix`      |
| Unit tests        | `npm test`                 |
| Coverage          | `npm run test:coverage`    |
| Integration tests | `npm run test:integration` |
| Commit (wizard)   | `npm run commit`           |

## Architecture

- **Root config files** are thin re-exports — actual logic lives in `scripts/` (`eslint.config.mts` → `scripts/eslint-config.ts`, etc.).
- **`src/`** — plugin source:
  - `main.ts` — Obsidian entry point; enables `@obsidian-typings` typings and default-exports the `Plugin` class.
  - `plugin.ts` — `Plugin` extends dev-utils `PluginBase`; `onloadImpl` adds a `FixTabSizeComponent` child.
  - `fix-tab-size-component.ts` — `FixTabSizeComponent` extends `ComponentEx`; listens for the `layout-change` workspace event and, once a `MarkdownView` exists, installs the patch component (one-shot via `isPatched`) and calls `editMode.updateOptions()` on all markdown views.
  - `patches/markdown-edit-view-get-dynamic-extensions-patch-component.ts` — `MarkdownEditViewGetDynamicExtensionsPatchComponent` extends `MonkeyAroundComponent`; monkey-patches `getDynamicExtensions` on the markdown edit view prototype to replace the hardcoded 4-space tab extension with the vault's configured `tabSize` (when `useTab` is off).
- **`main` field** points to `src/main.ts` (Obsidian plugin source entry; built artifact is `dist/build/main.js`, not published to npm).
