/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'selector-class-pattern': null,
  },
  ignoreFiles: ['**/*.js', '**/*.ts', '**/*.vue', 'node_modules/**', 'dist/**'],
}
