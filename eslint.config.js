export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.next/**', 'coverage/**', 'public/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-console': 'off',
    },
  },
];
