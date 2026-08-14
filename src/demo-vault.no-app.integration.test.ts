import process from 'node:process';
import { registerDemoVaultCoverageSuite } from 'obsidian-dev-utils/script-utils/demo-vault-coverage';
import { getRootFolder } from 'obsidian-dev-utils/script-utils/root';

// Keeps the in-repo `demo-vault/` honest WITHOUT launching Obsidian. Fix Tab Size has no settings and
// No public API interface — it patches the editor's dynamic extensions and nothing else — so there is
// Nothing to reflect from source and the suite is registered with `rootFolder` alone. What it still
// Enforces is the authoring convention every vault owes its readers: an `# H1` and a prose opener on
// Every note, Markdown links rather than wikilinks (which do not render on GitHub), no `[Docs]` line,
// And every note reachable from `00 Start.md`. The plugin's runtime behavior is covered by the other
// Tests.
registerDemoVaultCoverageSuite({ rootFolder: getRootFolder() ?? process.cwd() });
