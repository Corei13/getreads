module.exports = {
  parserOptions: {
    ecmaVersion: 10,
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true
  },
  rules: {
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used'
      }
    ],
    'linebreak-style': [2, 'unix'],
    'eol-last': 2,
    'no-var': 2,
    'prefer-const': 2,
    'no-multiple-empty-lines': [
      2,
      {
        max: 2
      }
    ],
    'no-console': 0,
    'no-extra-bind': 2,
    'no-undef': 2,
    semi: 2
  }
};
