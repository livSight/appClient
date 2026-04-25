// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['components/AppText.tsx', 'components/AppTextInput.tsx'],
    rules: {
      // `expo lint` sometimes parses TS/TSX imports with a non-TS parser in import rules.
      // These rules are not critical for this UI-only app and can false-positive.
      'import/namespace': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text', 'TextInput'],
              message: 'Use AppText/AppTextInput wrappers (Dynamic Type policy).',
            },
          ],
        },
      ],
    },
  },
]);
