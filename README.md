# Fix Tab Size

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/mnaoumov)
[![GitHub release](https://img.shields.io/github/v/release/mnaoumov/obsidian-fix-tab-size)](https://github.com/mnaoumov/obsidian-fix-tab-size/releases)
[![GitHub downloads](https://img.shields.io/github/downloads/mnaoumov/obsidian-fix-tab-size/total)](https://github.com/mnaoumov/obsidian-fix-tab-size/releases)
[![Coverage: 100%](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/mnaoumov/obsidian-fix-tab-size)

[Obsidian](https://obsidian.md/) has an **Indent visual width** setting, and then ignores it for real
tab characters: press `Tab` with `Indent using tabs` on and the editor always draws that tab at its own
fixed width, whatever you configured. Tab-indented text therefore lines up differently in Obsidian than
in every other editor that opens the same file.

This plugin makes the editor render each tab at the width you actually set, so the indentation you see
is the indentation you chose.

Reported on the [forum](https://forum.obsidian.md/t/customizing-universal-tab-size/7998/2).

<!-- markdownlint-disable MD033 -->

<a href="images/screenshots/screenshot-desktop-1.png"><img src="images/screenshots/screenshot-desktop-1.png" alt="Indent visual width ${String(WIDE_TAB_SIZE)}, and Tab still inserts ${String(OBSIDIAN_HARDCODED_TAB_SIZE)} spaces" width="600"></a>

<details>
<summary>More screenshots</summary>

<a href="images/screenshots/screenshot-desktop-2.png"><img src="images/screenshots/screenshot-desktop-2.png" alt="With the plugin: Tab inserts the ${String(WIDE_TAB_SIZE)} you asked for" width="600"></a>
<a href="images/screenshots/screenshot-desktop-3.png"><img src="images/screenshots/screenshot-desktop-3.png" alt="Set ${String(NARROW_TAB_SIZE)}, and Tab inserts ${String(NARROW_TAB_SIZE)}" width="600"></a>
<a href="images/screenshots/screenshot-mobile-1.png"><img src="images/screenshots/screenshot-mobile-1.png" alt="Indent visual width ${String(WIDE_TAB_SIZE)}, and indenting still adds ${String(OBSIDIAN_HARDCODED_TAB_SIZE)} spaces" width="270"></a>
<a href="images/screenshots/screenshot-mobile-2.png"><img src="images/screenshots/screenshot-mobile-2.png" alt="With the plugin: indenting adds the ${String(WIDE_TAB_SIZE)} you asked for" width="270"></a>
<a href="images/screenshots/screenshot-mobile-3.png"><img src="images/screenshots/screenshot-mobile-3.png" alt="Set ${String(NARROW_TAB_SIZE)}, and indenting adds ${String(NARROW_TAB_SIZE)}" width="270"></a>

</details>

<!-- markdownlint-enable MD033 -->

## Demo vault

**The documentation is a demo vault.** The feature has a note that explains what it does and why you
would want it, with a tab-indented sample to watch as you change the setting.

**[Start reading here](<./demo-vault/00 Start.md>)** — it is plain markdown, so it works on GitHub with
nothing installed.

A copy of the vault ships with every release. You can access it via any of the following:

1. Running the **Fix Tab Size: Open demo vault** command.
2. Downloading `fix-tab-size-demo-vault-<version>.zip` (`<version>` is the release version) from the [Releases](https://github.com/mnaoumov/obsidian-fix-tab-size/releases).
3. Browsing its source in [`demo-vault/`](./demo-vault/README.md) in this repository.

## What it does

- **Tabs render at your configured width**, matching `Indent visual width` instead of Obsidian's fixed
  one. There is nothing to configure in the plugin itself.
  [01 Fix tab size](<./demo-vault/01 Fix tab size.md>)

## Installation

The plugin is available in [the official Community Plugins repository](https://community.obsidian.md/plugins/fix-tab-size).

### Beta versions

To install the latest beta release of this plugin (regardless if it is available in [the official Community Plugins repository](https://community.obsidian.md) or not), follow these steps:

1. Ensure you have the [BRAT plugin](https://community.obsidian.md/plugins/obsidian42-brat) installed and enabled.
2. Click [Install via BRAT](https://intradeus.github.io/http-protocol-redirector?r=obsidian://brat?plugin=https://github.com/mnaoumov/obsidian-fix-tab-size).
3. An Obsidian pop-up window should appear. In the window, click the `Add plugin` button once and wait a few seconds for the plugin to install.

## Debugging

By default, debug messages for this plugin are hidden.

To show them, run the following command:

```js
window.DEBUG.enable('fix-tab-size');
```

For more details, refer to the [documentation](https://mnaoumov.dev/obsidian-dev-utils/guides/debugging/).

## Changelog

All notable changes to this project will be documented in the [CHANGELOG](./CHANGELOG.md).

## Contributing

Contributions are welcome — see [CONTRIBUTING](./CONTRIBUTING.md) to get set up.

## Support

<!-- markdownlint-disable MD033 -->

<a href="https://www.buymeacoffee.com/mnaoumov" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60" width="217"></a>

<!-- markdownlint-enable MD033 -->

## My other Obsidian resources

[See my other Obsidian resources](https://github.com/mnaoumov/obsidian-resources).

## License

© [Michael Naumov](https://github.com/mnaoumov/)
