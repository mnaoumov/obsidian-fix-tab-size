import type { Linter } from 'eslint';

import { defineEslintConfigs } from '@mnaoumov/obsidian-dev-toolkit/linters/eslint-config';
import { defineConfig } from 'eslint/config';

export const configs: Linter.Config[] = defineEslintConfigs({
  customConfigs(context) {
    return defineConfig([
      {
        /**
         * The toolkit registers the `typescript-dev-toolkit` plugin for the context's TypeScript files alone, so a rule
         * of that plugin turned on without `files` reaches `package.json`, `LICENSE` and the root `.mjs` configs too,
         * and ESLint aborts the whole run on the missing plugin.
         */
        files: context.allFiles(),
        rules: {
          'typescript-dev-toolkit/no-undefined-return-type': 'error'
        }
      }
    ]);
  }
});
