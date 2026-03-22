import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "path";
import { fileURLToPath } from "url";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

const airbnbConfigs = compat.extends('airbnb', 'airbnb-typescript', 'airbnb/hooks').map(config => ({
  ...config,
  files: ['**/*.{ts,tsx}'],
}));

export default tseslint.config(
  { ignores: ['dist', 'eslint.config.js', 'vite.config.ts'] },
  ...airbnbConfigs,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/react-in-jsx-scope': 'off', // Not needed for React 17+
      'import/extensions': 'off', // TypeScript handles this naturally
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            'vite.config.ts',
            'eslint.config.js',
          ],
        },
      ],
    },
  },
  prettierConfig,
);
