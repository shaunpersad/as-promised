module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: 'airbnb-base',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'no-trailing-spaces': 'off',
    'padded-blocks': 'off',
    'no-console': 'off',
    'arrow-parens': 'off',
    'no-return-assign': 'off',
    'no-param-reassign': 'off',
    'no-empty': 'off',
    'consistent-return': 'off',
    'no-shadow': 'off',
  },
  overrides: [
    {
      files: [
        'tests/**/*.test.js'
      ],
      env: {
        mocha: true
      },
      rules: {
        'prefer-arrow-callback': 'off',
        'func-names': 'off',
        'global-require': 'off'
      }
    }
  ]
};
